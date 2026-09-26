import { apiClient } from './client';
import {
  WarehouseItem,
  WarehouseCreateInput,
  WarehouseUpdateInput,
  LocationItem,
  LocationCreateInput,
  LocationUpdateInput,
} from '../types/warehouse';

export interface IWarehouseService {
  getWarehouses(params?: { search?: string; is_active?: boolean }): Promise<WarehouseItem[]>;
  getWarehouseById(id: number): Promise<WarehouseItem>;
  createWarehouse(input: WarehouseCreateInput): Promise<WarehouseItem>;
  updateWarehouse(id: number, input: WarehouseUpdateInput): Promise<WarehouseItem>;
  getLocations(params?: { warehouse_id?: number; search?: string }): Promise<LocationItem[]>;
  getLocationById(id: number): Promise<LocationItem>;
  getWarehouseLocations(warehouseId: number): Promise<LocationItem[]>;
  createLocation(input: LocationCreateInput): Promise<LocationItem>;
  updateLocation(id: number, input: LocationUpdateInput): Promise<LocationItem>;
}

export class FastApiWarehouseService implements IWarehouseService {
  async getWarehouses(params?: { search?: string; is_active?: boolean }): Promise<WarehouseItem[]> {
    return apiClient<WarehouseItem[]>('/warehouses', {
      method: 'GET',
      params: {
        search: params?.search,
        is_active: params?.is_active,
        limit: 100,
      },
    });
  }

  async getWarehouseById(id: number): Promise<WarehouseItem> {
    return apiClient<WarehouseItem>(`/warehouses/${id}`, {
      method: 'GET',
    });
  }

  async createWarehouse(input: WarehouseCreateInput): Promise<WarehouseItem> {
    const payload: Record<string, unknown> = {
      name: input.name.trim(),
      is_active: input.is_active ?? true,
    };
    if (input.code && input.code.trim()) {
      payload.code = input.code.trim().toUpperCase();
    }
    if (input.address && input.address.trim()) {
      payload.address = input.address.trim();
    }

    return apiClient<WarehouseItem>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateWarehouse(id: number, input: WarehouseUpdateInput): Promise<WarehouseItem> {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) {
      payload.name = input.name.trim();
    }
    if (input.code !== undefined) {
      payload.code = input.code ? input.code.trim().toUpperCase() : null;
    }
    if (input.address !== undefined) {
      payload.address = input.address ? input.address.trim() : null;
    }
    if (input.is_active !== undefined) {
      payload.is_active = input.is_active;
    }

    return apiClient<WarehouseItem>(`/warehouses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getLocations(params?: { warehouse_id?: number; search?: string }): Promise<LocationItem[]> {
    return apiClient<LocationItem[]>('/locations', {
      method: 'GET',
      params: {
        warehouse_id: params?.warehouse_id,
        search: params?.search,
        limit: 200,
      },
    });
  }

  async getLocationById(id: number): Promise<LocationItem> {
    return apiClient<LocationItem>(`/locations/${id}`, {
      method: 'GET',
    });
  }

  async getWarehouseLocations(warehouseId: number): Promise<LocationItem[]> {
    return apiClient<LocationItem[]>(`/warehouses/${warehouseId}/locations`, {
      method: 'GET',
      params: { limit: 200 },
    });
  }

  async createLocation(input: LocationCreateInput): Promise<LocationItem> {
    const payload: Record<string, unknown> = {
      warehouse_id: input.warehouse_id,
      name: input.name.trim(),
      location_type: input.location_type || 'internal',
    };
    if (input.code && input.code.trim()) {
      payload.code = input.code.trim().toUpperCase();
    }

    return apiClient<LocationItem>('/locations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateLocation(id: number, input: LocationUpdateInput): Promise<LocationItem> {
    const payload: Record<string, unknown> = {};
    if (input.warehouse_id !== undefined) {
      payload.warehouse_id = input.warehouse_id;
    }
    if (input.name !== undefined) {
      payload.name = input.name.trim();
    }
    if (input.code !== undefined) {
      payload.code = input.code ? input.code.trim().toUpperCase() : null;
    }
    if (input.location_type !== undefined) {
      payload.location_type = input.location_type;
    }

    return apiClient<LocationItem>(`/locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

export const warehouseService = new FastApiWarehouseService();
