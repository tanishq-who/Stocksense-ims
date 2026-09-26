from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
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
