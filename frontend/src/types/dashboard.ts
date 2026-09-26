import { BackendOperation } from './delivery';

/**
 * FastAPI Backend Low Stock Product Item Schema matching LowStockProductItem
 */
export interface LowStockProductItem {
  product_id: number;
  product_name: string;
  name?: string | null;
  sku: string;
  category?: string | null;
  available_quantity: number;
  quantity?: number | null;
  reorder_level: number;
  location_id?: number | null;
  location: string;
  warehouse_id?: number | null;
  warehouse_name?: string | null;
  unit_of_measure?: string | null;
  status: string; // 'low_stock' | 'out_of_stock'
}

/**
 * FastAPI Backend Dashboard Schema matching DashboardResponse
 */
export interface DashboardResponse {
  total_products_in_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_receipts_count: number;
  pending_deliveries_count: number;
  scheduled_transfers_count: number;
  low_stock_products: LowStockProductItem[];
  recent_operations: BackendOperation[];
  total_products?: number | null;
  total_inventory_quantity?: number | null;
}

/**
 * Filter parameters supported by FastAPI GET /dashboard
 */
export interface DashboardFilterParams {
  operation_type?: string;
  status?: string;
  warehouse_id?: number;
  location_id?: number;
  category?: string;
  search?: string;
}

/**
 * FastAPI Backend Warehouse Schema matching WarehouseResponse
 */
export interface Warehouse {
  id: number;
  name: string;
  code?: string | null;
  address?: string | null;
}
