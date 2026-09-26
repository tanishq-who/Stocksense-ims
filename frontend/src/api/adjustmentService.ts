import { apiClient } from './client';
import {
  Adjustment,
  AdjustmentItem,
  CreateAdjustmentInput,
  AdjustmentFilterParams,
  mapBackendStatusToAdjustmentStatus,
} from '../types/adjustment';
import { BackendOperation, BackendLocation, BackendProduct } from '../types/delivery';

export interface LocationStockLevel {
  productId: number;
  locationId: number;
  quantity: number;
}

export interface IAdjustmentService {
  getAdjustments(params?: AdjustmentFilterParams): Promise<Adjustment[]>;
  getAdjustmentById(id: number): Promise<Adjustment>;
  createAdjustment(input: CreateAdjustmentInput): Promise<Adjustment>;
  validateAdjustment(id: number): Promise<Adjustment>;
  getLocations(): Promise<BackendLocation[]>;
  getProducts(): Promise<BackendProduct[]>;
  getStockLevels(): Promise<LocationStockLevel[]>;
}

export class FastApiAdjustmentService implements IAdjustmentService {
  private async loadLookups(): Promise<{
    productMap: Map<number, BackendProduct>;
    locationMap: Map<number, string>;
    stockLevelMap: Map<string, number>;
  }> {
    const [products, locations, stockLevels] = await Promise.all([
      apiClient<BackendProduct[]>('/products', { method: 'GET', params: { limit: 500 } }).catch(
        () => [] as BackendProduct[]
      ),
      apiClient<BackendLocation[]>('/api/locations', { method: 'GET', params: { limit: 200 } }).catch(
        () => [] as BackendLocation[]
      ),
      apiClient<any[]>('/api/stock-levels', { method: 'GET', params: { limit: 500 } }).catch(
        () => [] as any[]
      ),
    ]);

    const productMap = new Map<number, BackendProduct>();
    products.forEach((p) => productMap.set(p.id, p));

    const locationMap = new Map<number, string>();
    locations.forEach((l) => locationMap.set(l.id, l.name));

    const stockLevelMap = new Map<string, number>();
    stockLevels.forEach((sl) => {
      stockLevelMap.set(`${sl.product_id}_${sl.location_id}`, sl.quantity || 0);
    });

    return { productMap, locationMap, stockLevelMap };
  }

  private mapOperationToAdjustment(
    op: BackendOperation,
    lookups: {
      productMap: Map<number, BackendProduct>;
      locationMap: Map<number, string>;
      stockLevelMap: Map<string, number>;
    }
  ): Adjustment {
    const locId = op.location_id || op.destination_location_id || op.source_location_id || 0;
    const locName = lookups.locationMap.get(locId) || (locId ? `Bay ${locId}` : 'Main Facility Zone');

    const items: AdjustmentItem[] = (op.lines || []).map((line) => {
      const prod = lookups.productMap.get(line.product_id);
      const recorded = lookups.stockLevelMap.get(`${line.product_id}_${locId}`) || 0;
      const physical =
        line.physical_count !== undefined && line.physical_count !== null
          ? line.physical_count
          : line.quantity;
      const difference = physical - recorded;

      return {
        id: line.id,
        productId: line.product_id,
        productName: prod ? prod.name : `Product #${line.product_id}`,
        sku: prod ? prod.sku : `SKU-${line.product_id}`,
        category: prod?.category || 'General Inventory',
        unit: prod?.unit_of_measure || 'units',
        recordedStock: recorded,
        physicalCount: physical,
        difference,
      };
    });

    return {
      id: op.id,
      reference: op.reference,
      locationId: locId,
      locationName: locName,
      status: mapBackendStatusToAdjustmentStatus(op.status),
      reason: op.reason,
      items,
      createdAt: op.created_at,
      updatedAt: op.updated_at,
    };
  }

  async getAdjustments(params?: AdjustmentFilterParams): Promise<Adjustment[]> {
    const queryParams: Record<string, string | number | undefined> = {
      operation_type: 'adjustment',
      limit: 200,
    };

    if (params?.status && params.status.toLowerCase() !== 'all') {
      queryParams.status = params.status.toLowerCase();
    }

    const [operations, lookups] = await Promise.all([
      apiClient<BackendOperation[]>('/operations', {
        method: 'GET',
        params: queryParams,
      }),
      this.loadLookups(),
    ]);

    let adjustments = (operations || []).map((op) => this.mapOperationToAdjustment(op, lookups));

    // Client-side search and filtering
    if (params?.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      adjustments = adjustments.filter(
        (a) =>
          a.reference.toLowerCase().includes(term) ||
          a.locationName.toLowerCase().includes(term) ||
          (a.reason && a.reason.toLowerCase().includes(term)) ||
          a.items.some(
            (item) =>
              item.productName.toLowerCase().includes(term) ||
              item.sku.toLowerCase().includes(term) ||
              item.category.toLowerCase().includes(term)
          )
      );
    }

    if (params?.locationId) {
      adjustments = adjustments.filter((a) => a.locationId === params.locationId);
    }

    if (params?.discrepancyType && params.discrepancyType !== 'all') {
      adjustments = adjustments.filter((a) => {
        if (params.discrepancyType === 'positive') {
          return a.items.some((i) => i.difference > 0);
        }
        if (params.discrepancyType === 'negative') {
          return a.items.some((i) => i.difference < 0);
        }
        if (params.discrepancyType === 'neutral') {
          return a.items.every((i) => i.difference === 0);
        }
        return true;
      });
    }

    return adjustments;
  }

  async getAdjustmentById(id: number): Promise<Adjustment> {
    const [op, lookups] = await Promise.all([
      apiClient<BackendOperation>(`/operations/${id}`, { method: 'GET' }),
      this.loadLookups(),
    ]);
    return this.mapOperationToAdjustment(op, lookups);
  }

  async createAdjustment(input: CreateAdjustmentInput): Promise<Adjustment> {
    const payload: {
      location_id: number;
      lines: { product_id: number; physical_count: number }[];
      reason?: string;
    } = {
      location_id: Number(input.locationId),
      lines: input.lines.map((l) => ({
        product_id: Number(l.productId),
        physical_count: Number(l.physicalCount),
      })),
    };

    if (input.reason && input.reason.trim()) {
      payload.reason = input.reason.trim();
    }

    let op = await apiClient<BackendOperation>('/operations/adjustments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (input.validateImmediately) {
      op = await apiClient<BackendOperation>(`/operations/${op.id}/validate`, {
        method: 'POST',
      });
    }

    const lookups = await this.loadLookups();
    return this.mapOperationToAdjustment(op, lookups);
  }

  async validateAdjustment(id: number): Promise<Adjustment> {
    const [op, lookups] = await Promise.all([
      apiClient<BackendOperation>(`/operations/${id}/validate`, {
        method: 'POST',
      }),
      this.loadLookups(),
    ]);
    return this.mapOperationToAdjustment(op, lookups);
  }

  async getLocations(): Promise<BackendLocation[]> {
    try {
      const locations = await apiClient<BackendLocation[]>('/api/locations', { method: 'GET' });
      return locations || [];
    } catch {
      return [];
    }
  }

  async getProducts(): Promise<BackendProduct[]> {
    try {
      const products = await apiClient<BackendProduct[]>('/products', { method: 'GET' });
      return products || [];
    } catch {
      return [];
    }
  }

  async getStockLevels(): Promise<LocationStockLevel[]> {
    try {
      const levels = await apiClient<any[]>('/api/stock-levels', {
        method: 'GET',
        params: { limit: 500 },
      });
      return (levels || []).map((l) => ({
        productId: l.product_id,
        locationId: l.location_id,
        quantity: l.quantity || 0,
      }));
    } catch {
      return [];
    }
  }
}

export const adjustmentService: IAdjustmentService = new FastApiAdjustmentService();
