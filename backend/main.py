from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db, init_db
import models
import schemas


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables and apply migrations upon startup
    init_db()
    yield


app = FastAPI(
    title="StockSense IMS API",
    description="Real-time Inventory Management System API with persistent SQLite storage",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=schemas.HealthResponse, tags=["Health"])
def get_health():
    """Health check endpoint returning service status."""
    return {"status": "ok"}


# Product Endpoints
@app.post(
    "/products",
    response_model=schemas.ProductResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Products"],
    summary="Create a new product",
)
@app.post(
    "/api/products",
    response_model=schemas.ProductResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new product with required validation:
    - name and sku are required and cannot be empty
    - sku must be unique
    - unit_of_measure is required and cannot be empty
    - reorder_level must be 0 or greater
    - price must be 0 or greater
    """
    existing_product = db.query(models.Product).filter(models.Product.sku == product_in.sku).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_in.sku}' already exists. SKU must be unique.",
        )

    product = models.Product(**product_in.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_in.sku}' already exists. SKU must be unique.",
        )
    return product


@app.get(
    "/products",
    response_model=List[schemas.ProductResponse],
    tags=["Products"],
    summary="List all products",
)
@app.get(
    "/api/products",
    response_model=List[schemas.ProductResponse],
    include_in_schema=False,
)
def list_products(
    search: Optional[str] = Query(None, description="Search by name, SKU, or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Max number of records to return"),
    db: Session = Depends(get_db),
):
    """List products with optional search query and category filtering."""
    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category.ilike(f"%{category.strip()}%"))
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (models.Product.name.ilike(search_pattern))
            | (models.Product.sku.ilike(search_pattern))
            | (models.Product.description.ilike(search_pattern))
        )
    return query.offset(skip).limit(limit).all()


@app.get(
    "/products/{id}",
    response_model=schemas.ProductResponse,
    tags=["Products"],
    summary="Get a product by ID",
)
@app.get(
    "/api/products/{id}",
    response_model=schemas.ProductResponse,
    include_in_schema=False,
)
def get_product(id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific product by its ID."""
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found.",
        )
    return product


@app.patch(
    "/products/{id}",
    response_model=schemas.ProductResponse,
    tags=["Products"],
    summary="Update a product by ID",
)
@app.patch(
    "/api/products/{id}",
    response_model=schemas.ProductResponse,
    include_in_schema=False,
)
def patch_product(id: int, product_in: schemas.ProductUpdate, db: Session = Depends(get_db)):
    """
    Partially update a product by its ID.
    Validates that:
    - product exists
    - sku (if provided) is unique across other products
    - reorder_level (if provided) is >= 0
    - string fields are not blank
    """
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found.",
        )

    update_data = product_in.model_dump(exclude_unset=True)
    if not update_data:
        return product

    # If SKU is updated, ensure uniqueness across other products
    if "sku" in update_data and update_data["sku"] != product.sku:
        existing_sku = (
            db.query(models.Product)
            .filter(models.Product.sku == update_data["sku"], models.Product.id != id)
            .first()
        )
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_data['sku']}' already exists. SKU must be unique.",
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Integrity violation while updating product.",
        )
    return product


# Operations Endpoints (Receipts, Deliveries, and Internal Transfers)
@app.post(
    "/operations/receipts",
    response_model=schemas.OperationResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Operations"],
    summary="Create a Draft incoming receipt operation",
)
def create_receipt(receipt_in: schemas.ReceiptCreate, db: Session = Depends(get_db)):
    """
    Create a Draft receipt with supplier, destination_location_id, and one or more lines
    containing product_id and positive quantity.
    """
    dest_loc = db.query(models.Location).filter(models.Location.id == receipt_in.destination_location_id).first()
    if not dest_loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination location with ID {receipt_in.destination_location_id} not found.",
        )

    for line in receipt_in.lines:
        prod = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {line.product_id} not found.",
            )

    # Generate unique sequential operation reference for receipts
    total_receipts = db.query(models.Operation).filter(models.Operation.operation_type == "receipt").count()
    ref_idx = total_receipts + 1
    reference = f"REC-{ref_idx:05d}"
    while db.query(models.Operation).filter(models.Operation.reference == reference).first():
        ref_idx += 1
        reference = f"REC-{ref_idx:05d}"

    operation = models.Operation(
        reference=reference,
        operation_type="receipt",
        status="draft",
        supplier=receipt_in.supplier,
        destination_location_id=receipt_in.destination_location_id,
    )
    db.add(operation)
    db.flush()

    for line in receipt_in.lines:
        op_line = models.OperationLine(
            operation_id=operation.id,
            product_id=line.product_id,
            quantity=line.quantity,
        )
        db.add(op_line)

    db.commit()
    db.refresh(operation)
    return operation


@app.post(
    "/operations/deliveries",
    response_model=schemas.OperationResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Operations"],
    summary="Create a Draft delivery order operation",
)
def create_delivery(delivery_in: schemas.DeliveryCreate, db: Session = Depends(get_db)):
    """
    Create a Draft delivery order with customer/contact, source_location_id,
    scheduled_date, and one or more lines with product_id and positive quantity.
    """
    source_loc = db.query(models.Location).filter(models.Location.id == delivery_in.source_location_id).first()
    if not source_loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source location with ID {delivery_in.source_location_id} not found.",
        )

    for line in delivery_in.lines:
        prod = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {line.product_id} not found.",
            )

    # Generate unique sequential operation reference for deliveries
    total_deliveries = db.query(models.Operation).filter(models.Operation.operation_type == "delivery").count()
    ref_idx = total_deliveries + 1
    reference = f"DEL-{ref_idx:05d}"
    while db.query(models.Operation).filter(models.Operation.reference == reference).first():
        ref_idx += 1
        reference = f"DEL-{ref_idx:05d}"

    operation = models.Operation(
        reference=reference,
        operation_type="delivery",
        status="draft",
        customer=delivery_in.customer,
        source_location_id=delivery_in.source_location_id,
        scheduled_date=delivery_in.scheduled_date or datetime.now(timezone.utc),
    )
    db.add(operation)
    db.flush()

    for line in delivery_in.lines:
        op_line = models.OperationLine(
            operation_id=operation.id,
            product_id=line.product_id,
            quantity=line.quantity,
        )
        db.add(op_line)

    db.commit()
    db.refresh(operation)
    return operation


@app.post(
    "/operations/transfers",
    response_model=schemas.OperationResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Operations"],
    summary="Create a Draft internal transfer operation",
)
def create_transfer(transfer_in: schemas.TransferCreate, db: Session = Depends(get_db)):
    """
    Create a Draft internal transfer with source_location_id, destination_location_id,
    scheduled_date, and one or more lines with product_id and positive quantity.
    """
    # Rule 1: Source and destination locations must be different
    if transfer_in.source_location_id == transfer_in.destination_location_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Source location and destination location must be different.",
        )

    source_loc = db.query(models.Location).filter(models.Location.id == transfer_in.source_location_id).first()
    if not source_loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source location with ID {transfer_in.source_location_id} not found.",
        )

    dest_loc = db.query(models.Location).filter(models.Location.id == transfer_in.destination_location_id).first()
    if not dest_loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination location with ID {transfer_in.destination_location_id} not found.",
        )

    for line in transfer_in.lines:
        prod = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {line.product_id} not found.",
            )

    # Generate unique sequential operation reference for internal transfers
    total_transfers = db.query(models.Operation).filter(models.Operation.operation_type == "transfer").count()
    ref_idx = total_transfers + 1
    reference = f"TRF-{ref_idx:05d}"
    while db.query(models.Operation).filter(models.Operation.reference == reference).first():
        ref_idx += 1
        reference = f"TRF-{ref_idx:05d}"

    operation = models.Operation(
        reference=reference,
        operation_type="transfer",
        status="draft",
        source_location_id=transfer_in.source_location_id,
        destination_location_id=transfer_in.destination_location_id,
        scheduled_date=transfer_in.scheduled_date or datetime.now(timezone.utc),
    )
    db.add(operation)
    db.flush()

    for line in transfer_in.lines:
        op_line = models.OperationLine(
            operation_id=operation.id,
            product_id=line.product_id,
            quantity=line.quantity,
        )
        db.add(op_line)

    db.commit()
    db.refresh(operation)
    return operation


@app.post(
    "/operations/adjustments",
    response_model=schemas.OperationResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Operations"],
    summary="Create a Draft stock adjustment operation",
)
def create_adjustment(adjustment_in: schemas.AdjustmentCreate, db: Session = Depends(get_db)):
    """
    Create a Draft stock adjustment with location_id, one or more lines
    containing product_id and physical_count, and an optional reason.
    """
    loc = db.query(models.Location).filter(models.Location.id == adjustment_in.location_id).first()
    if not loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with ID {adjustment_in.location_id} not found.",
        )

    for line in adjustment_in.lines:
        prod = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {line.product_id} not found.",
            )

    # Generate unique sequential operation reference for adjustments
    total_adjustments = db.query(models.Operation).filter(models.Operation.operation_type == "adjustment").count()
    ref_idx = total_adjustments + 1
    reference = f"ADJ-{ref_idx:05d}"
    while db.query(models.Operation).filter(models.Operation.reference == reference).first():
        ref_idx += 1
        reference = f"ADJ-{ref_idx:05d}"

    operation = models.Operation(
        reference=reference,
        operation_type="adjustment",
        status="draft",
        location_id=adjustment_in.location_id,
        reason=adjustment_in.reason,
    )
    db.add(operation)
    db.flush()

    for line in adjustment_in.lines:
        op_line = models.OperationLine(
            operation_id=operation.id,
            product_id=line.product_id,
            quantity=line.physical_count,
            physical_count=line.physical_count,
        )
        db.add(op_line)

    db.commit()
    db.refresh(operation)
    return operation


@app.post(
    "/operations/{id}/validate",
    response_model=schemas.OperationResponse,
    tags=["Operations"],
    summary="Validate a Draft operation (Receipt, Delivery, Transfer, or Adjustment)",
)
def validate_operation(id: int, db: Session = Depends(get_db)):
    """
    Validate a Draft operation using a single database transaction.

    For Receipts:
    1. Create or update StockLevel for every product at the destination location.
    2. Increase quantity by the received amount.
    3. Create immutable StockLedgerEntry for every line with positive delta and balance_after.
    4. Change receipt status to Done.

    For Deliveries:
    1. Check stock availability for every line before changing any stock.
    2. If any product has insufficient stock, return a clear 422 error showing product,
       requested quantity, and available quantity. Do not change any data.
    3. If all lines are available, decrease StockLevel at the source location.
    4. Create immutable StockLedgerEntry records with negative deltas and balance_after.
    5. Mark the delivery Done.

    For Internal Transfers:
    1. Source and destination locations must be different.
    2. Check that all products have sufficient stock at the source before changing data.
    3. If insufficient, return a clear 422 error and change nothing.
    4. On success, decrease source StockLevel and increase destination StockLevel within one database transaction.
    5. Create two StockLedgerEntry records per line: a negative source entry and a positive destination entry,
       both with balance_after.
    6. Mark the operation Done and reject repeated validation.

    For Stock Adjustments:
    1. physical_count must be zero or greater.
    2. Read current StockLevel for each product/location.
    3. Calculate delta = physical_count - current_quantity.
    4. Set the StockLevel quantity to physical_count.
    5. Create immutable StockLedgerEntry with that delta, physical_count as balance_after,
       location, timestamp, operation reference, and reason.
    6. Mark the adjustment Done and reject repeated validation.
    7. Support both positive and negative adjustment deltas.
    """
    operation = db.query(models.Operation).filter(models.Operation.id == id).first()
    if not operation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Operation with ID {id} not found.",
        )

    # Reject if already validated
    if operation.status == "done":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Operation with ID {id} has already been validated and is marked as 'done'.",
        )

    if operation.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only 'draft' operations can be validated. Current status is '{operation.status}'.",
        )

    if not operation.lines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operation has no lines to validate.",
        )

    now_ts = datetime.now(timezone.utc)

    # Case A: Incoming Receipt Validation
    if operation.operation_type == "receipt":
        if not operation.destination_location_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Receipt has no destination location specified.",
            )

        dest_location = db.query(models.Location).filter(models.Location.id == operation.destination_location_id).first()
        if not dest_location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Destination location with ID {operation.destination_location_id} does not exist.",
            )

        try:
            for line in operation.lines:
                stock_level = (
                    db.query(models.StockLevel)
                    .filter(
                        models.StockLevel.product_id == line.product_id,
                        models.StockLevel.location_id == operation.destination_location_id,
                    )
                    .first()
                )
                if not stock_level:
                    product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
                    reorder_threshold = product.reorder_level if product else 10.0
                    stock_level = models.StockLevel(
                        product_id=line.product_id,
                        location_id=operation.destination_location_id,
                        quantity=line.quantity,
                        reserved_quantity=0.0,
                        reorder_threshold=reorder_threshold,
                    )
                    db.add(stock_level)
                    db.flush()
                    balance_after = stock_level.quantity
                else:
                    stock_level.quantity += line.quantity
                    db.flush()
                    balance_after = stock_level.quantity

                ledger_entry = models.StockLedgerEntry(
                    product_id=line.product_id,
                    location_id=operation.destination_location_id,
                    operation_id=operation.id,
                    operation_reference=operation.reference,
                    delta=line.quantity,
                    balance_after=balance_after,
                    timestamp=now_ts,
                )
                db.add(ledger_entry)

            operation.status = "done"
            operation.updated_at = now_ts
            db.commit()
            db.refresh(operation)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transaction failed during receipt validation: {str(e)}",
            )
        return operation

    # Case B: Delivery Order Validation
    elif operation.operation_type == "delivery":
        if not operation.source_location_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivery order has no source location specified.",
            )

        source_location = db.query(models.Location).filter(models.Location.id == operation.source_location_id).first()
        if not source_location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Source location with ID {operation.source_location_id} does not exist.",
            )

        # 1. Check stock availability for every line before changing any stock
        requested_totals = {}
        for line in operation.lines:
            requested_totals[line.product_id] = requested_totals.get(line.product_id, 0.0) + line.quantity

        insufficient_items = []
        for prod_id, req_qty in requested_totals.items():
            stock_level = (
                db.query(models.StockLevel)
                .filter(
                    models.StockLevel.product_id == prod_id,
                    models.StockLevel.location_id == operation.source_location_id,
                )
                .first()
            )
            available_qty = stock_level.quantity if stock_level else 0.0
            if available_qty < req_qty:
                product = db.query(models.Product).filter(models.Product.id == prod_id).first()
                prod_name = product.name if product else f"Product #{prod_id}"
                prod_sku = product.sku if product else ""
                insufficient_items.append({
                    "product_id": prod_id,
                    "product_name": prod_name,
                    "sku": prod_sku,
                    "requested_quantity": req_qty,
                    "available_quantity": available_qty,
                    "shortage": req_qty - available_qty,
                })

        # 2. If any product has insufficient stock, return clear 422 error without modifying data
        if insufficient_items:
            error_details = [
                f"'{item['product_name']}' (SKU: {item['sku']}): requested {item['requested_quantity']}, available {item['available_quantity']} (shortage: {item['shortage']})"
                for item in insufficient_items
            ]
            detail_msg = f"Insufficient stock at source location: {'; '.join(error_details)}."
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "message": detail_msg,
                    "insufficient_items": insufficient_items,
                },
            )

        # 3. If all lines are available, decrease StockLevel and record negative ledger deltas
        try:
            for line in operation.lines:
                stock_level = (
                    db.query(models.StockLevel)
                    .filter(
                        models.StockLevel.product_id == line.product_id,
                        models.StockLevel.location_id == operation.source_location_id,
                    )
                    .first()
                )
                stock_level.quantity -= line.quantity
                db.flush()
                balance_after = stock_level.quantity

                # 4. Create immutable StockLedgerEntry record with negative delta
                ledger_entry = models.StockLedgerEntry(
                    product_id=line.product_id,
                    location_id=operation.source_location_id,
                    operation_id=operation.id,
                    operation_reference=operation.reference,
                    delta=-line.quantity,
                    balance_after=balance_after,
                    timestamp=now_ts,
                )
                db.add(ledger_entry)

            # 5. Mark the delivery Done
            operation.status = "done"
            operation.updated_at = now_ts
            db.commit()
            db.refresh(operation)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transaction failed during delivery validation: {str(e)}",
            )
        return operation

    # Case C: Internal Transfer Validation
    elif operation.operation_type == "transfer":
        if not operation.source_location_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transfer operation has no source location specified.",
            )
        if not operation.destination_location_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transfer operation has no destination location specified.",
            )

        # Rule 1: Source and destination locations must be different
        if operation.source_location_id == operation.destination_location_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Source location and destination location must be different.",
            )

        source_location = db.query(models.Location).filter(models.Location.id == operation.source_location_id).first()
        if not source_location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Source location with ID {operation.source_location_id} does not exist.",
            )

        dest_location = db.query(models.Location).filter(models.Location.id == operation.destination_location_id).first()
        if not dest_location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Destination location with ID {operation.destination_location_id} does not exist.",
            )

        # Rule 2: Check that all products have sufficient stock at the source before changing data
        requested_totals = {}
        for line in operation.lines:
            requested_totals[line.product_id] = requested_totals.get(line.product_id, 0.0) + line.quantity

        insufficient_items = []
        for prod_id, req_qty in requested_totals.items():
            stock_level = (
                db.query(models.StockLevel)
                .filter(
                    models.StockLevel.product_id == prod_id,
                    models.StockLevel.location_id == operation.source_location_id,
                )
                .first()
            )
            available_qty = stock_level.quantity if stock_level else 0.0
            if available_qty < req_qty:
                product = db.query(models.Product).filter(models.Product.id == prod_id).first()
                prod_name = product.name if product else f"Product #{prod_id}"
                prod_sku = product.sku if product else ""
                insufficient_items.append({
                    "product_id": prod_id,
                    "product_name": prod_name,
                    "sku": prod_sku,
                    "requested_quantity": req_qty,
                    "available_quantity": available_qty,
                    "shortage": req_qty - available_qty,
                })

        # Rule 3: If insufficient, return clear 422 error and change nothing
        if insufficient_items:
            error_details = [
                f"'{item['product_name']}' (SKU: {item['sku']}): requested {item['requested_quantity']}, available {item['available_quantity']} (shortage: {item['shortage']})"
                for item in insufficient_items
            ]
            detail_msg = f"Insufficient stock at source location: {'; '.join(error_details)}."
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "message": detail_msg,
                    "insufficient_items": insufficient_items,
                },
            )

        # Rule 4 & 5: Decrease source, increase destination, and create two ledger entries per line
        try:
            for line in operation.lines:
                # 1. Decrease source StockLevel
                src_stock = (
                    db.query(models.StockLevel)
                    .filter(
                        models.StockLevel.product_id == line.product_id,
                        models.StockLevel.location_id == operation.source_location_id,
                    )
                    .first()
                )
                src_stock.quantity -= line.quantity
                db.flush()
                src_balance_after = src_stock.quantity

                # 2. Increase destination StockLevel
                dst_stock = (
                    db.query(models.StockLevel)
                    .filter(
                        models.StockLevel.product_id == line.product_id,
                        models.StockLevel.location_id == operation.destination_location_id,
                    )
                    .first()
                )
                if not dst_stock:
                    product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
                    reorder_threshold = product.reorder_level if product else 10.0
                    dst_stock = models.StockLevel(
                        product_id=line.product_id,
                        location_id=operation.destination_location_id,
                        quantity=line.quantity,
                        reserved_quantity=0.0,
                        reorder_threshold=reorder_threshold,
                    )
                    db.add(dst_stock)
                    db.flush()
                    dst_balance_after = dst_stock.quantity
                else:
                    dst_stock.quantity += line.quantity
                    db.flush()
                    dst_balance_after = dst_stock.quantity

                # 3. Create negative source StockLedgerEntry
                src_ledger = models.StockLedgerEntry(
                    product_id=line.product_id,
                    location_id=operation.source_location_id,
                    operation_id=operation.id,
                    operation_reference=operation.reference,
                    delta=-line.quantity,
                    balance_after=src_balance_after,
                    timestamp=now_ts,
                )
                db.add(src_ledger)

                # 4. Create positive destination StockLedgerEntry
                dst_ledger = models.StockLedgerEntry(
                    product_id=line.product_id,
                    location_id=operation.destination_location_id,
                    operation_id=operation.id,
                    operation_reference=operation.reference,
                    delta=line.quantity,
                    balance_after=dst_balance_after,
                    timestamp=now_ts,
                )
                db.add(dst_ledger)

            # Rule 6: Mark Done
            operation.status = "done"
            operation.updated_at = now_ts
            db.commit()
            db.refresh(operation)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transaction failed during transfer validation: {str(e)}",
            )
        return operation

    # Case D: Stock Adjustment Validation
    elif operation.operation_type == "adjustment":
        if not operation.location_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock adjustment has no location specified.",
            )

        loc = db.query(models.Location).filter(models.Location.id == operation.location_id).first()
        if not loc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Location with ID {operation.location_id} does not exist.",
            )

        # Rule 1: physical_count must be zero or greater
        for line in operation.lines:
            target_count = line.physical_count if line.physical_count is not None else line.quantity
            if target_count < 0.0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Physical count for product ID {line.product_id} must be zero or greater.",
                )

        try:
            for line in operation.lines:
                target_count = line.physical_count if line.physical_count is not None else line.quantity

                # Rule 2: Read current StockLevel for each product/location
                stock_level = (
                    db.query(models.StockLevel)
                    .filter(
                        models.StockLevel.product_id == line.product_id,
                        models.StockLevel.location_id == operation.location_id,
                    )
                    .first()
                )
                current_qty = stock_level.quantity if stock_level else 0.0

                # Rule 3: Calculate delta = physical_count - current_quantity
                delta = target_count - current_qty

                # Rule 4: Set the StockLevel quantity to physical_count
                if not stock_level:
                    product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
                    reorder_threshold = product.reorder_level if product else 10.0
                    stock_level = models.StockLevel(
                        product_id=line.product_id,
                        location_id=operation.location_id,
                        quantity=target_count,
                        reserved_quantity=0.0,
                        reorder_threshold=reorder_threshold,
                    )
                    db.add(stock_level)
                else:
                    stock_level.quantity = target_count
                db.flush()

                # Rule 5: Create immutable StockLedgerEntry with delta, physical_count as balance_after,
                # location, timestamp, operation reference, and reason
                ledger_entry = models.StockLedgerEntry(
                    product_id=line.product_id,
                    location_id=operation.location_id,
                    operation_id=operation.id,
                    operation_reference=operation.reference,
                    delta=delta,
                    balance_after=target_count,
                    reason=operation.reason,
                    timestamp=now_ts,
                )
                db.add(ledger_entry)

            # Rule 6: Mark Done
            operation.status = "done"
            operation.updated_at = now_ts
            db.commit()
            db.refresh(operation)
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transaction failed during adjustment validation: {str(e)}",
            )
        return operation

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown operation type '{operation.operation_type}'.",
        )


@app.get(
    "/operations",
    response_model=List[schemas.OperationResponse],
    tags=["Operations"],
    summary="List all operations",
)
def list_operations(
    status: Optional[str] = Query(None, description="Filter by status (e.g. draft, done)"),
    operation_type: Optional[str] = Query(None, description="Filter by operation type (e.g. receipt, delivery, transfer)"),
    type: Optional[str] = Query(None, description="Alias for operation_type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List operations with optional filtering by status and operation type."""
    query = db.query(models.Operation)
    if status:
        query = query.filter(models.Operation.status == status.strip().lower())
    op_type = operation_type or type
    if op_type:
        query = query.filter(models.Operation.operation_type == op_type.strip().lower())
    return query.order_by(models.Operation.id.desc()).offset(skip).limit(limit).all()


@app.get(
    "/operations/{id}",
    response_model=schemas.OperationResponse,
    tags=["Operations"],
    summary="Get operation by ID",
)
def get_operation(id: int, db: Session = Depends(get_db)):
    """Retrieve details for a single operation by ID."""
    operation = db.query(models.Operation).filter(models.Operation.id == id).first()
    if not operation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Operation with ID {id} not found.",
        )
    return operation


# Ledger Endpoints
@app.get(
    "/ledger",
    response_model=List[schemas.StockLedgerEntryResponse],
    tags=["Stock Ledger"],
    summary="List stock ledger entries",
)
def list_stock_ledger(
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    operation_reference: Optional[str] = Query(None, description="Filter by operation reference"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List immutable stock ledger audit trail entries."""
    query = db.query(models.StockLedgerEntry)
    if product_id is not None:
        query = query.filter(models.StockLedgerEntry.product_id == product_id)
    if location_id is not None:
        query = query.filter(models.StockLedgerEntry.location_id == location_id)
    if operation_reference is not None:
        query = query.filter(models.StockLedgerEntry.operation_reference == operation_reference.strip())
    return query.order_by(models.StockLedgerEntry.id.desc()).offset(skip).limit(limit).all()


# Dashboard and Alert Endpoints
@app.get(
    "/dashboard",
    response_model=schemas.DashboardResponse,
    tags=["Dashboard & Alerts"],
    summary="Get aggregated dashboard metrics and low-stock overview",
)
@app.get(
    "/api/dashboard",
    response_model=schemas.DashboardResponse,
    include_in_schema=False,
)
def get_dashboard(
    operation_type: Optional[str] = Query(None, description="Filter operations by type (receipt, delivery, transfer, adjustment)"),
    status: Optional[str] = Query(None, description="Filter operations by status (draft, done, cancelled)"),
    warehouse_id: Optional[int] = Query(None, description="Filter metrics by warehouse ID"),
    location_id: Optional[int] = Query(None, description="Filter metrics by location ID"),
    category: Optional[str] = Query(None, description="Filter metrics by product category"),
    db: Session = Depends(get_db),
):
    """
    Retrieve real-time SQLite-backed dashboard metrics:
    - total_products_in_stock
    - low_stock_count
    - out_of_stock_count
    - pending_receipts_count
    - pending_deliveries_count
    - scheduled_transfers_count
    - low_stock_products list with product name, SKU, available quantity, reorder_level, and location
    - recent_operations list
    Supports query filters: operation_type, status, warehouse_id, location_id, category.
    """
    # 1. Determine target location IDs based on location_id and/or warehouse_id
    target_location_ids = None
    if location_id is not None and warehouse_id is not None:
        loc = db.query(models.Location).filter(
            models.Location.id == location_id,
            models.Location.warehouse_id == warehouse_id,
        ).first()
        target_location_ids = [location_id] if loc else []
    elif location_id is not None:
        loc = db.query(models.Location).filter(models.Location.id == location_id).first()
        target_location_ids = [location_id] if loc else []
    elif warehouse_id is not None:
        locs = db.query(models.Location.id).filter(models.Location.warehouse_id == warehouse_id).all()
        target_location_ids = [loc[0] for loc in locs]

    # 2. Query products matching category if provided
    prod_query = db.query(models.Product)
    if category and category.strip():
        prod_query = prod_query.filter(func.lower(models.Product.category) == category.strip().lower())
    products = prod_query.all()
    matching_product_ids = {p.id for p in products}

    # 3. Query stock levels in scope
    if target_location_ids is not None and not target_location_ids:
        stock_levels = []
    else:
        stock_query = db.query(models.StockLevel)
        if target_location_ids is not None:
            stock_query = stock_query.filter(models.StockLevel.location_id.in_(target_location_ids))
        if matching_product_ids:
            stock_query = stock_query.filter(models.StockLevel.product_id.in_(matching_product_ids))
            stock_levels = stock_query.all()
        else:
            stock_levels = []

    prod_stock_map = {}
    for sl in stock_levels:
        prod_stock_map.setdefault(sl.product_id, []).append(sl)

    total_products_in_stock = 0
    out_of_stock_count = 0
    low_stock_products = []
    total_inventory_quantity = 0.0

    if target_location_ids is not None:
        relevant_products = [p for p in products if p.id in prod_stock_map]
    else:
        relevant_products = products

    for prod in relevant_products:
        p_levels = prod_stock_map.get(prod.id, [])
        total_avail_for_prod = 0.0

        for sl in p_levels:
            avail = max(0.0, sl.quantity - (sl.reserved_quantity or 0.0))
            total_avail_for_prod += avail
            total_inventory_quantity += sl.quantity

            # Low stock rule: available quantity > 0 and <= reorder_level
            reorder_lvl = prod.reorder_level if prod.reorder_level > 0.0 else (
                sl.reorder_threshold if sl.reorder_threshold > 0.0 else 0.0
            )
            if reorder_lvl > 0.0 and 0.0 < avail <= reorder_lvl:
                loc_name = sl.location.name if sl.location else f"Location #{sl.location_id}"
                wh_id = sl.location.warehouse_id if sl.location else None
                wh_name = sl.location.warehouse.name if (sl.location and sl.location.warehouse) else None
                low_stock_products.append(
                    schemas.LowStockProductItem(
                        product_id=prod.id,
                        product_name=prod.name,
                        name=prod.name,
                        sku=prod.sku,
                        category=prod.category,
                        available_quantity=avail,
                        quantity=avail,
                        reorder_level=reorder_lvl,
                        location_id=sl.location_id,
                        location=loc_name,
                        warehouse_id=wh_id,
                        warehouse_name=wh_name,
                        unit_of_measure=prod.unit_of_measure,
                        status="low_stock",
                    )
                )

        if total_avail_for_prod > 0.0:
            total_products_in_stock += 1
        else:
            out_of_stock_count += 1

    low_stock_count = len(low_stock_products)

    # 4. Pending and scheduled operations counts
    def apply_op_category(q):
        if category and category.strip():
            return q.filter(
                models.Operation.lines.any(
                    models.OperationLine.product.has(
                        func.lower(models.Product.category) == category.strip().lower()
                    )
                )
            )
        return q

    # Pending Receipts (draft receipts)
    pending_receipts_count = 0
    if (operation_type is None or operation_type.strip().lower() == "receipt") and (
        status is None or status.strip().lower() == "draft"
    ):
        if target_location_ids is not None and not target_location_ids:
            pending_receipts_count = 0
        else:
            q_rec = db.query(models.Operation).filter(
                models.Operation.operation_type == "receipt",
                models.Operation.status == "draft",
            )
            if target_location_ids is not None:
                q_rec = q_rec.filter(models.Operation.destination_location_id.in_(target_location_ids))
            q_rec = apply_op_category(q_rec)
            pending_receipts_count = q_rec.count()

    # Pending Deliveries (draft deliveries)
    pending_deliveries_count = 0
    if (operation_type is None or operation_type.strip().lower() == "delivery") and (
        status is None or status.strip().lower() == "draft"
    ):
        if target_location_ids is not None and not target_location_ids:
            pending_deliveries_count = 0
        else:
            q_del = db.query(models.Operation).filter(
                models.Operation.operation_type == "delivery",
                models.Operation.status == "draft",
            )
            if target_location_ids is not None:
                q_del = q_del.filter(models.Operation.source_location_id.in_(target_location_ids))
            q_del = apply_op_category(q_del)
            pending_deliveries_count = q_del.count()

    # Scheduled Transfers (draft transfers)
    scheduled_transfers_count = 0
    if (operation_type is None or operation_type.strip().lower() == "transfer") and (
        status is None or status.strip().lower() == "draft"
    ):
        if target_location_ids is not None and not target_location_ids:
            scheduled_transfers_count = 0
        else:
            q_trf = db.query(models.Operation).filter(
                models.Operation.operation_type == "transfer",
                models.Operation.status == "draft",
            )
            if target_location_ids is not None:
                q_trf = q_trf.filter(
                    or_(
                        models.Operation.source_location_id.in_(target_location_ids),
                        models.Operation.destination_location_id.in_(target_location_ids),
                    )
                )
            q_trf = apply_op_category(q_trf)
            scheduled_transfers_count = q_trf.count()

    # 5. Recent operations
    recent_ops_query = db.query(models.Operation)
    if operation_type and operation_type.strip():
        recent_ops_query = recent_ops_query.filter(
            models.Operation.operation_type == operation_type.strip().lower()
        )
    if status and status.strip():
        recent_ops_query = recent_ops_query.filter(
            models.Operation.status == status.strip().lower()
        )
    if target_location_ids is not None:
        if not target_location_ids:
            recent_ops_query = recent_ops_query.filter(False)
        else:
            recent_ops_query = recent_ops_query.filter(
                or_(
                    models.Operation.location_id.in_(target_location_ids),
                    models.Operation.source_location_id.in_(target_location_ids),
                    models.Operation.destination_location_id.in_(target_location_ids),
                )
            )
    recent_ops_query = apply_op_category(recent_ops_query)
    recent_operations = recent_ops_query.order_by(models.Operation.id.desc()).limit(10).all()

    return schemas.DashboardResponse(
        total_products_in_stock=total_products_in_stock,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        pending_receipts_count=pending_receipts_count,
        pending_deliveries_count=pending_deliveries_count,
        scheduled_transfers_count=scheduled_transfers_count,
        low_stock_products=low_stock_products,
        recent_operations=recent_operations,
        total_products=len(relevant_products),
        total_inventory_quantity=total_inventory_quantity,
    )


@app.get(
    "/alerts/low-stock",
    response_model=List[schemas.LowStockProductItem],
    tags=["Dashboard & Alerts"],
    summary="Get low-stock and out-of-stock product alerts",
)
@app.get(
    "/api/alerts/low-stock",
    response_model=List[schemas.LowStockProductItem],
    include_in_schema=False,
)
def get_low_stock_alerts(
    warehouse_id: Optional[int] = Query(None, description="Filter alerts by warehouse ID"),
    location_id: Optional[int] = Query(None, description="Filter alerts by location ID"),
    category: Optional[str] = Query(None, description="Filter alerts by product category"),
    status: Optional[str] = Query(None, description="Filter by status: 'low_stock' (default), 'out_of_stock', or 'all'"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Retrieve products with low-stock or out-of-stock alerts:
    - Low stock: available quantity > 0 and <= reorder_level
    - Out of stock: available quantity == 0
    Returns dynamic data backed by SQLite queries with useful empty states when no data exists.
    """
    target_location_ids = None
    if location_id is not None and warehouse_id is not None:
        loc = db.query(models.Location).filter(
            models.Location.id == location_id,
            models.Location.warehouse_id == warehouse_id,
        ).first()
        target_location_ids = [location_id] if loc else []
    elif location_id is not None:
        loc = db.query(models.Location).filter(models.Location.id == location_id).first()
        target_location_ids = [location_id] if loc else []
    elif warehouse_id is not None:
        locs = db.query(models.Location.id).filter(models.Location.warehouse_id == warehouse_id).all()
        target_location_ids = [loc[0] for loc in locs]

    if target_location_ids is not None and not target_location_ids:
        return []

    prod_q = db.query(models.Product)
    if category and category.strip():
        prod_q = prod_q.filter(func.lower(models.Product.category) == category.strip().lower())
    products = prod_q.all()
    if not products:
        return []
    prod_map = {p.id: p for p in products}

    stock_q = db.query(models.StockLevel).filter(models.StockLevel.product_id.in_(prod_map.keys()))
    if target_location_ids is not None:
        stock_q = stock_q.filter(models.StockLevel.location_id.in_(target_location_ids))
    stock_levels = stock_q.all()

    stock_map = {}
    for sl in stock_levels:
        stock_map.setdefault(sl.product_id, []).append(sl)

    filter_mode = (status or "low_stock").strip().lower()
    alerts = []

    # 1. Low stock items (0 < avail <= reorder_level)
    if filter_mode in ("low_stock", "all", "both"):
        for sl in stock_levels:
            prod = prod_map.get(sl.product_id)
            if not prod:
                continue
            avail = max(0.0, sl.quantity - (sl.reserved_quantity or 0.0))
            reorder_lvl = prod.reorder_level if prod.reorder_level > 0.0 else (
                sl.reorder_threshold if sl.reorder_threshold > 0.0 else 0.0
            )
            if reorder_lvl > 0.0 and 0.0 < avail <= reorder_lvl:
                loc_name = sl.location.name if sl.location else f"Location #{sl.location_id}"
                wh_id = sl.location.warehouse_id if sl.location else None
                wh_name = sl.location.warehouse.name if (sl.location and sl.location.warehouse) else None
                alerts.append(
                    schemas.LowStockProductItem(
                        product_id=prod.id,
                        product_name=prod.name,
                        name=prod.name,
                        sku=prod.sku,
                        category=prod.category,
                        available_quantity=avail,
                        quantity=avail,
                        reorder_level=reorder_lvl,
                        location_id=sl.location_id,
                        location=loc_name,
                        warehouse_id=wh_id,
                        warehouse_name=wh_name,
                        unit_of_measure=prod.unit_of_measure,
                        status="low_stock",
                    )
                )

    # 2. Out of stock items (available_quantity == 0)
    if filter_mode in ("out_of_stock", "all", "both"):
        for prod in products:
            p_levels = stock_map.get(prod.id, [])
            total_avail = sum(max(0.0, sl.quantity - (sl.reserved_quantity or 0.0)) for sl in p_levels)
            if total_avail == 0.0:
                loc_name = "N/A"
                loc_id = None
                wh_id = None
                wh_name = None
                if p_levels:
                    loc_name = p_levels[0].location.name if p_levels[0].location else f"Location #{p_levels[0].location_id}"
                    loc_id = p_levels[0].location_id
                    wh_id = p_levels[0].location.warehouse_id if p_levels[0].location else None
                    wh_name = p_levels[0].location.warehouse.name if (p_levels[0].location and p_levels[0].location.warehouse) else None
                elif target_location_ids and len(target_location_ids) == 1:
                    single_loc = db.query(models.Location).filter(models.Location.id == target_location_ids[0]).first()
                    if single_loc:
                        loc_name = single_loc.name
                        loc_id = single_loc.id
                        wh_id = single_loc.warehouse_id
                        wh_name = single_loc.warehouse.name if single_loc.warehouse else None

                reorder_lvl = prod.reorder_level if prod.reorder_level > 0.0 else (
                    p_levels[0].reorder_threshold if p_levels and p_levels[0].reorder_threshold > 0.0 else 0.0
                )
                alerts.append(
                    schemas.LowStockProductItem(
                        product_id=prod.id,
                        product_name=prod.name,
                        name=prod.name,
                        sku=prod.sku,
                        category=prod.category,
                        available_quantity=0.0,
                        quantity=0.0,
                        reorder_level=reorder_lvl,
                        location_id=loc_id,
                        location=loc_name,
                        warehouse_id=wh_id,
                        warehouse_name=wh_name,
                        unit_of_measure=prod.unit_of_measure,
                        status="out_of_stock",
                    )
                )

    return alerts[skip : skip + limit]


# Warehouse Endpoints
@app.post("/api/warehouses", response_model=schemas.WarehouseResponse, status_code=status.HTTP_201_CREATED, tags=["Warehouses"])
def create_warehouse(warehouse_in: schemas.WarehouseCreate, db: Session = Depends(get_db)):
    """Create a new warehouse."""
    existing = (
        db.query(models.Warehouse)
        .filter((models.Warehouse.code == warehouse_in.code) | (models.Warehouse.name == warehouse_in.name))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Warehouse with this name or code already exists.",
        )
    warehouse = models.Warehouse(**warehouse_in.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@app.get("/api/warehouses", response_model=List[schemas.WarehouseResponse], tags=["Warehouses"])
def list_warehouses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all warehouses."""
    return db.query(models.Warehouse).offset(skip).limit(limit).all()


@app.get("/api/warehouses/{warehouse_id}", response_model=schemas.WarehouseResponse, tags=["Warehouses"])
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    """Get warehouse by ID."""
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse


# Location Endpoints
@app.post("/api/locations", response_model=schemas.LocationResponse, status_code=status.HTTP_201_CREATED, tags=["Locations"])
def create_location(location_in: schemas.LocationCreate, db: Session = Depends(get_db)):
    """Create a new location inside a warehouse."""
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == location_in.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    location = models.Location(**location_in.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@app.get("/api/locations", response_model=List[schemas.LocationResponse], tags=["Locations"])
def list_locations(warehouse_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List locations, optionally filtered by warehouse."""
    query = db.query(models.Location)
    if warehouse_id is not None:
        query = query.filter(models.Location.warehouse_id == warehouse_id)
    return query.offset(skip).limit(limit).all()


@app.get("/api/locations/{location_id}", response_model=schemas.LocationResponse, tags=["Locations"])
def get_location(location_id: int, db: Session = Depends(get_db)):
    """Get location by ID."""
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return location


# StockLevel Endpoints
@app.post("/api/stock-levels", response_model=schemas.StockLevelResponse, status_code=status.HTTP_201_CREATED, tags=["Stock Levels"])
def create_stock_level(stock_in: schemas.StockLevelCreate, db: Session = Depends(get_db)):
    """Create or record stock level for a product at a location."""
    product = db.query(models.Product).filter(models.Product.id == stock_in.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    location = db.query(models.Location).filter(models.Location.id == stock_in.location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    existing = (
        db.query(models.StockLevel)
        .filter(
            models.StockLevel.product_id == stock_in.product_id,
            models.StockLevel.location_id == stock_in.location_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock level record already exists for this product and location. Use update instead.",
        )

    stock_level = models.StockLevel(**stock_in.model_dump())
    db.add(stock_level)
    try:
        db.commit()
        db.refresh(stock_level)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Integrity violation while recording stock level.",
        )
    return stock_level


@app.get("/api/stock-levels", response_model=List[schemas.StockLevelResponse], tags=["Stock Levels"])
def list_stock_levels(
    product_id: int = None,
    location_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List stock levels with optional filters for product or location."""
    query = db.query(models.StockLevel)
    if product_id is not None:
        query = query.filter(models.StockLevel.product_id == product_id)
    if location_id is not None:
        query = query.filter(models.StockLevel.location_id == location_id)
    return query.offset(skip).limit(limit).all()


@app.get("/api/stock-levels/{stock_id}", response_model=schemas.StockLevelResponse, tags=["Stock Levels"])
def get_stock_level(stock_id: int, db: Session = Depends(get_db)):
    """Get stock level by ID."""
    stock = db.query(models.StockLevel).filter(models.StockLevel.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock level not found")
    return stock
