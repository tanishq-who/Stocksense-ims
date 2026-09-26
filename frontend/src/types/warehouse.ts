/**
 * Warehouse & Location Types
 * Matching FastAPI schemas in backend/schemas.py
 */

export interface LocationStockSummary {
  total_quantity: number;
  products_in_stock_count: number;
  total_products?: number;
}

export interface LocationItem {
  id: number;
  warehouse_id: number;
  name: string;
  code?: string | null;
  location_type: string; // 'internal' | 'storage' | 'receiving' | 'dispatch'
  total_quantity: number;
  products_in_stock_count: number;
  total_products_in_stock: number;
  stock_summary?: LocationStockSummary | null;
  created_at: string;
  updated_at: string;
}

export interface WarehouseItem {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  is_active: boolean;
  locations_count?: number | null;
  created_at: string;
  updated_at: string;
}

export interface WarehouseCreateInput {
  name: string;
  code?: string;
  address?: string;
  is_active?: boolean;
}

export interface WarehouseUpdateInput {
  name?: string;
  code?: string;
  address?: string;
  is_active?: boolean;
}

export interface LocationCreateInput {
  warehouse_id: number;
  name: string;
  code?: string;
  location_type?: string;
}

export interface LocationUpdateInput {
  warehouse_id?: number;
  name?: string;
  code?: string;
  location_type?: string;
}
