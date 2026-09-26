/**
 * Product and Stock Types matching FastAPI schemas
 */

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  category?: string | null;
  price: number;
  unit_of_measure: string;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export type ProductStockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface ProductWithStock extends Product {
  stockOnHand: number;
  reservedStock: number;
  availableStock: number;
  locationName?: string;
  locationId?: number;
  status: ProductStockStatus;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  unit_of_measure: string;
  reorder_level?: number;
  initialStock?: number;
  locationId?: number;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  price?: number;
  unit_of_measure?: string;
  reorder_level?: number;
}

export interface StockLevel {
  id: number;
  product_id: number;
  location_id: number;
  quantity: number;
  reserved_quantity: number;
  reorder_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  status?: string;
  locationId?: number;
}
