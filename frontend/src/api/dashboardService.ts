import { apiClient } from './client';
import { DashboardResponse, LowStockProductItem, DashboardFilterParams, Warehouse } from '../types/dashboard';
import { BackendLocation, BackendProduct } from '../types/delivery';

export interface IDashboardService {
  getDashboard(params?: DashboardFilterParams): Promise<DashboardResponse>;
  getLowStockAlerts(params?: {
    warehouse_id?: number;
    location_id?: number;
    category?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<LowStockProductItem[]>;
  getWarehouses(): Promise<Warehouse[]>;
  getLocations(warehouseId?: number): Promise<BackendLocation[]>;
  getCategories(): Promise<string[]>;
}

export class FastApiDashboardService implements IDashboardService {
  async getDashboard(params?: DashboardFilterParams): Promise<DashboardResponse> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params) {
      if (params.operation_type && params.operation_type.toLowerCase() !== 'all') {
        queryParams.operation_type = params.operation_type.toLowerCase();
      }
      if (params.status && params.status.toLowerCase() !== 'all') {
        queryParams.status = params.status.toLowerCase();
      }
      if (params.warehouse_id !== undefined && params.warehouse_id !== null) {
        queryParams.warehouse_id = params.warehouse_id;
      }
      if (params.location_id !== undefined && params.location_id !== null) {
        queryParams.location_id = params.location_id;
      }
      if (params.category && params.category.toLowerCase() !== 'all') {
        queryParams.category = params.category;
      }
    }

    return apiClient<DashboardResponse>('/dashboard', {
      method: 'GET',
      params: queryParams,
    });
  }

  async getLowStockAlerts(params?: {
    warehouse_id?: number;
    location_id?: number;
    category?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<LowStockProductItem[]> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.warehouse_id) queryParams.warehouse_id = params.warehouse_id;
    if (params?.location_id) queryParams.location_id = params.location_id;
    if (params?.category && params.category.toLowerCase() !== 'all') queryParams.category = params.category;
    if (params?.status && params.status.toLowerCase() !== 'all') queryParams.status = params.status;
    if (params?.skip !== undefined) queryParams.skip = params.skip;
    if (params?.limit !== undefined) queryParams.limit = params.limit;

    return apiClient<LowStockProductItem[]>('/alerts/low-stock', {
      method: 'GET',
      params: queryParams,
    });
  }

  async getWarehouses(): Promise<Warehouse[]> {
    try {
      const warehouses = await apiClient<Warehouse[]>('/api/warehouses', {
        method: 'GET',
      });
      return warehouses || [];
    } catch (err) {
      console.warn('Failed to load warehouses from /api/warehouses:', err);
      return [];
    }
  }

  async getLocations(warehouseId?: number): Promise<BackendLocation[]> {
    try {
      const locations = await apiClient<BackendLocation[]>('/api/locations', {
        method: 'GET',
      });
      if (warehouseId) {
        return (locations || []).filter((l) => l.warehouse_id === warehouseId);
      }
      return locations || [];
    } catch (err) {
      console.warn('Failed to load locations from /api/locations:', err);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const products = await apiClient<BackendProduct[]>('/products', {
        method: 'GET',
      });
      const categories = new Set<string>();
      (products || []).forEach((p) => {
        if (p.category && p.category.trim()) {
          categories.add(p.category.trim());
        }
      });
      return Array.from(categories);
    } catch (err) {
      console.warn('Failed to load categories from /products:', err);
      return [];
    }
  }
}

export const dashboardService: IDashboardService = new FastApiDashboardService();
