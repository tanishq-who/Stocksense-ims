import { apiClient } from './client';
import {
  Transfer,
  TransferItem,
  CreateTransferInput,
  TransferFilterParams,
  mapBackendStatusToTransferStatus,
} from '../types/transfer';
import { BackendOperation, BackendLocation, BackendProduct } from '../types/delivery';

export interface LocationStock {
  productId: number;
  locationId: number;
  quantity: number;
}

export interface ITransferService {
  getTransfers(params?: TransferFilterParams): Promise<Transfer[]>;
  getTransferById(id: number): Promise<Transfer>;
  createTransfer(input: CreateTransferInput): Promise<Transfer>;
  validateTransfer(id: number): Promise<Transfer>;
  getLocations(): Promise<BackendLocation[]>;
  getProducts(): Promise<BackendProduct[]>;
  getStockLevels(): Promise<LocationStock[]>;
}

export class FastApiTransferService implements ITransferService {
  private async loadLookups(): Promise<{
    productMap: Map<number, BackendProduct>;
    locationMap: Map<number, string>;
  }> {
    const [products, locations] = await Promise.all([
      apiClient<BackendProduct[]>('/products', { method: 'GET', params: { limit: 500 } }).catch(
        () => [] as BackendProduct[]
      ),
      apiClient<BackendLocation[]>('/api/locations', { method: 'GET', params: { limit: 200 } }).catch(
        () => [] as BackendLocation[]
      ),
    ]);

    const productMap = new Map<number, BackendProduct>();
    products.forEach((p) => productMap.set(p.id, p));

    const locationMap = new Map<number, string>();
    locations.forEach((l) => locationMap.set(l.id, l.name));

    return { productMap, locationMap };
  }

  private mapOperationToTransfer(
    op: BackendOperation,
    lookups: { productMap: Map<number, BackendProduct>; locationMap: Map<number, string> }
  ): Transfer {
    const srcLocId = op.source_location_id || op.location_id || 0;
    const destLocId = op.destination_location_id || 0;

    const srcLocName = lookups.locationMap.get(srcLocId) || (srcLocId ? `Bay ${srcLocId}` : 'Main Warehouse');
    const destLocName = lookups.locationMap.get(destLocId) || (destLocId ? `Bay ${destLocId}` : 'Unassigned Bay');

    const items: TransferItem[] = (op.lines || []).map((line) => {
      const prod = lookups.productMap.get(line.product_id);
      return {
        id: line.id,
        productId: line.product_id,
        productName: prod ? prod.name : `Product #${line.product_id}`,
        sku: prod ? prod.sku : `SKU-${line.product_id}`,
        quantity: line.quantity,
        unit: prod ? prod.unit_of_measure : 'units',
      };
    });

    return {
      id: op.id,
      reference: op.reference,
      sourceLocationId: srcLocId,
      sourceLocationName: srcLocName,
      destinationLocationId: destLocId,
      destinationLocationName: destLocName,
      status: mapBackendStatusToTransferStatus(op.status),
      scheduledDate: op.scheduled_date || op.created_at,
      items,
      createdAt: op.created_at,
      updatedAt: op.updated_at,
    };
  }

  async getTransfers(params?: TransferFilterParams): Promise<Transfer[]> {
    const queryParams: Record<string, string | number | undefined> = {
      operation_type: 'transfer',
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

    let transfers = (operations || []).map((op) => this.mapOperationToTransfer(op, lookups));

    // Client-side search and location filtering
    if (params?.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      transfers = transfers.filter(
        (t) =>
          t.reference.toLowerCase().includes(term) ||
          t.sourceLocationName.toLowerCase().includes(term) ||
          t.destinationLocationName.toLowerCase().includes(term) ||
          t.items.some(
            (item) =>
              item.productName.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term)
          )
      );
    }

    if (params?.sourceLocationId) {
      transfers = transfers.filter((t) => t.sourceLocationId === params.sourceLocationId);
    }

    if (params?.destinationLocationId) {
      transfers = transfers.filter((t) => t.destinationLocationId === params.destinationLocationId);
    }

    return transfers;
  }

  async getTransferById(id: number): Promise<Transfer> {
    const [op, lookups] = await Promise.all([
      apiClient<BackendOperation>(`/operations/${id}`, { method: 'GET' }),
      this.loadLookups(),
    ]);
    return this.mapOperationToTransfer(op, lookups);
  }

  async createTransfer(input: CreateTransferInput): Promise<Transfer> {
    if (input.sourceLocationId === input.destinationLocationId) {
      throw new Error('Source location and destination location must be different.');
    }

    const payload: {
      source_location_id: number;
      destination_location_id: number;
      scheduled_date?: string;
      lines: { product_id: number; quantity: number }[];
    } = {
      source_location_id: Number(input.sourceLocationId),
      destination_location_id: Number(input.destinationLocationId),
      lines: input.lines.map((l) => ({
        product_id: Number(l.productId),
        quantity: Number(l.quantity),
      })),
    };

    if (input.scheduledDate) {
      payload.scheduled_date = new Date(input.scheduledDate).toISOString();
    }

    let op = await apiClient<BackendOperation>('/operations/transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (input.validateImmediately) {
      op = await apiClient<BackendOperation>(`/operations/${op.id}/validate`, {
        method: 'POST',
      });
    }

    const lookups = await this.loadLookups();
    return this.mapOperationToTransfer(op, lookups);
  }

  async validateTransfer(id: number): Promise<Transfer> {
    const [op, lookups] = await Promise.all([
      apiClient<BackendOperation>(`/operations/${id}/validate`, {
        method: 'POST',
      }),
      this.loadLookups(),
    ]);
    return this.mapOperationToTransfer(op, lookups);
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

  async getStockLevels(): Promise<LocationStock[]> {
    try {
      const levels = await apiClient<any[]>('/api/stock-levels', { method: 'GET', params: { limit: 500 } });
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

export const transferService: ITransferService = new FastApiTransferService();
