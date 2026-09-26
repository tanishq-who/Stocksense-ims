from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


# Health Check Schema
class HealthResponse(BaseModel):
    status: str = "ok"


# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name (required)")
    sku: str = Field(..., min_length=1, max_length=100, description="Stock Keeping Unit (required, unique)")
    description: Optional[str] = Field(None, description="Product description")
    category: Optional[str] = Field(None, max_length=100, description="Product category")
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
