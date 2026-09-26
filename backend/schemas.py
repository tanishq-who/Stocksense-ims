from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# Health Check Schema
class HealthResponse(BaseModel):
    status: str = "ok"


# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = Field(default=0.0, ge=0.0)
    unit_of_measure: str = Field(default="pcs", max_length=50)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    unit_of_measure: Optional[str] = Field(None, max_length=50)


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
