from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# Health Check Schema
class HealthResponse(BaseModel):
    status: str = "ok"


# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name (required)")
    sku: str = Field(..., min_length=1, max_length=100, description="Stock Keeping Unit (required, unique)")
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = Field(default=0.0, ge=0.0, description="Unit price, must be >= 0")
    unit_of_measure: str = Field(..., min_length=1, max_length=50, description="Unit of measurement (required)")
    reorder_level: float = Field(default=0.0, ge=0.0, description="Reorder level threshold, must be >= 0")

    @field_validator("name", "sku", "unit_of_measure")
    @classmethod
    def validate_not_blank(cls, value: str, info) -> str:
        if not value or not value.strip():
            field_display = info.field_name.replace("_", " ").title()
            raise ValueError(f"{field_display} is required and cannot be empty or whitespace.")
        return value.strip()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[float] = Field(None, ge=0.0)
    unit_of_measure: Optional[str] = Field(None, min_length=1, max_length=50)
    reorder_level: Optional[float] = Field(None, ge=0.0)

    @field_validator("name", "sku", "unit_of_measure")
    @classmethod
    def validate_not_blank_if_present(cls, value: Optional[str], info) -> Optional[str]:
        if value is not None:
            if not value.strip():
                field_display = info.field_name.replace("_", " ").title()
                raise ValueError(f"{field_display} cannot be empty or whitespace.")
            return value.strip()
        return value


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Warehouse Schemas
class WarehouseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    address: Optional[str] = None
    is_active: bool = True


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = None
    is_active: Optional[bool] = None


class WarehouseResponse(WarehouseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Location Schemas
class LocationBase(BaseModel):
    warehouse_id: int
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    location_type: str = Field(default="internal", max_length=50)


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    warehouse_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    location_type: Optional[str] = Field(None, max_length=50)


class LocationResponse(LocationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# StockLevel Schemas
class StockLevelBase(BaseModel):
    product_id: int
    location_id: int
    quantity: float = Field(default=0.0, ge=0.0)
    reserved_quantity: float = Field(default=0.0, ge=0.0)
    reorder_threshold: float = Field(default=10.0, ge=0.0)


class StockLevelCreate(StockLevelBase):
    pass


class StockLevelUpdate(BaseModel):
    quantity: Optional[float] = Field(None, ge=0.0)
    reserved_quantity: Optional[float] = Field(None, ge=0.0)
    reorder_threshold: Optional[float] = Field(None, ge=0.0)


class StockLevelResponse(StockLevelBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Operation & Line Item Schemas
class OperationLineCreate(BaseModel):
    product_id: int = Field(..., gt=0, description="Product ID (must be > 0)")
    quantity: float = Field(..., gt=0.0, description="Quantity (must be greater than 0)")


class OperationLineResponse(BaseModel):
    id: int
    operation_id: int
    product_id: int
    quantity: float
    physical_count: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# Incoming Receipt Creation Schema
class ReceiptCreate(BaseModel):
    supplier: str = Field(..., min_length=1, max_length=255, description="Supplier name (required)")
    destination_location_id: int = Field(..., gt=0, description="Destination location ID (required)")
    lines: List[OperationLineCreate] = Field(..., min_length=1, description="One or more lines containing product_id and positive quantity")

    @field_validator("supplier")
    @classmethod
    def validate_supplier(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Supplier is required and cannot be empty or whitespace.")
        return value.strip()


# Delivery Order Creation Schema
class DeliveryCreate(BaseModel):
    customer: str = Field(..., min_length=1, max_length=255, description="Customer or contact name (required)")
    source_location_id: int = Field(..., gt=0, description="Source location ID (required)")
    scheduled_date: Optional[datetime] = Field(None, description="Scheduled date for delivery")
    lines: List[OperationLineCreate] = Field(..., min_length=1, description="One or more lines containing product_id and positive quantity")

    @field_validator("customer")
    @classmethod
    def validate_customer(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Customer/contact is required and cannot be empty or whitespace.")
        return value.strip()


# Internal Transfer Creation Schema
class TransferCreate(BaseModel):
    source_location_id: int = Field(..., gt=0, description="Source location ID (required)")
    destination_location_id: int = Field(..., gt=0, description="Destination location ID (required)")
    scheduled_date: Optional[datetime] = Field(None, description="Scheduled date for transfer")
    lines: List[OperationLineCreate] = Field(..., min_length=1, description="One or more lines containing product_id and positive quantity")

    @model_validator(mode="after")
    def validate_different_locations(self):
        if self.source_location_id == self.destination_location_id:
            raise ValueError("Source location and destination location must be different.")
        return self


# Stock Adjustment Creation Schema
class AdjustmentLineCreate(BaseModel):
    product_id: int = Field(..., gt=0, description="Product ID (must be > 0)")
    physical_count: float = Field(..., ge=0.0, description="Physical count quantity (must be zero or greater)")


class AdjustmentCreate(BaseModel):
    location_id: int = Field(..., gt=0, description="Location ID where inventory adjustment is performed (required)")
    lines: List[AdjustmentLineCreate] = Field(..., min_length=1, description="One or more lines containing product_id and physical_count (>= 0)")
    reason: Optional[str] = Field(None, max_length=500, description="Optional reason for the adjustment (e.g. damaged inventory, count discrepancy)")

    @field_validator("reason")
    @classmethod
    def clean_reason(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            val = value.strip()
            return val if val else None
        return None


class OperationResponse(BaseModel):
    id: int
    reference: str
    operation_type: str
    status: str
    supplier: Optional[str] = None
    customer: Optional[str] = None
    location_id: Optional[int] = None
    source_location_id: Optional[int] = None
    destination_location_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    reason: Optional[str] = None
    lines: List[OperationLineResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Stock Ledger Schemas
class StockLedgerEntryResponse(BaseModel):
    id: int
    product_id: int
    location_id: int
    operation_id: Optional[int] = None
    operation_reference: str
    delta: float
    balance_after: float
    reason: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# Validation Error Detail Schemas
class InsufficientStockItem(BaseModel):
    product_id: int
    product_name: str
    sku: str
    requested_quantity: float
    available_quantity: float
    shortage: float


# Dashboard & Alert Schemas
class LowStockProductItem(BaseModel):
    product_id: int
    product_name: str
    name: Optional[str] = None
    sku: str
    category: Optional[str] = None
    available_quantity: float
    quantity: Optional[float] = None
    reorder_level: float
    location_id: Optional[int] = None
    location: str
    warehouse_id: Optional[int] = None
    warehouse_name: Optional[str] = None
    unit_of_measure: Optional[str] = "pcs"
    status: str = "low_stock"

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_aliases(self):
        if self.name is None:
            self.name = self.product_name
        if self.quantity is None:
            self.quantity = self.available_quantity
        return self


class DashboardResponse(BaseModel):
    total_products_in_stock: int
    low_stock_count: int
    out_of_stock_count: int
    pending_receipts_count: int
    pending_deliveries_count: int
    scheduled_transfers_count: int
    low_stock_products: List[LowStockProductItem] = []
    recent_operations: List[OperationResponse] = []
    total_products: Optional[int] = None
    total_inventory_quantity: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
