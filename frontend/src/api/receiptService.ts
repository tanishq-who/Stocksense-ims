import { apiClient } from './client';
import {
  Receipt,
  ReceiptItem,
  CreateReceiptInput,
  ReceiptFilterParams,
  mapBackendStatusToReceiptStatus,
} from '../types/receipt';
import { BackendOperation, BackendLocation, BackendProduct } from '../types/delivery';

export interface IReceiptService {
  getReceipts(params?: ReceiptFilterParams): Promise<Receipt[]>;
  getReceiptById(id: number): Promise<Receipt>;
  createReceipt(input: CreateReceiptInput): Promise<Receipt>;
  validateReceipt(id: number): Promise<Receipt>;
  getLocations(): Promise<BackendLocation[]>;
  getProducts(): Promise<BackendProduct[]>;
}

export class FastApiReceiptService implements IReceiptService {
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

  private mapOperationToReceipt(
    op: BackendOperation,
    lookups: { productMap: Map<number, BackendProduct>; locationMap: Map<number, string> }
  ): Receipt {
    const destLocName = op.destination_location_id
      ? lookups.locationMap.get(op.destination_location_id) || `Location #${op.destination_location_id}`
      : op.location_id
      ? lookups.locationMap.get(op.location_id) || `Location #${op.location_id}`
      : 'Main Receiving Dock';

    const items: ReceiptItem[] = (op.lines || []).map((line) => {
      const prod = lookups.productMap.get(line.product_id);
      return {
        id: line.id,
        productId: line.product_id,
        productName: prod ? prod.name : `Product #${line.product_id}`,
        sku: prod ? prod.sku : `SKU-${line.product_id}`,
        quantity: line.quantity,
        unit: prod ? prod.unit_of_measure : 'pcs',
      };
    });

    return {
      id: op.id,
      reference: op.reference,
      supplier: op.supplier || 'Vendor PO Intake',
      destinationLocationId: op.destination_location_id || 0,
      destinationLocationName: destLocName,
      status: mapBackendStatusToReceiptStatus(op.status),
      scheduledDate: op.scheduled_date || op.created_at,
      items,
      createdAt: op.created_at,
      updatedAt: op.updated_at,
    };
  }

  async getReceipts(params?: ReceiptFilterParams): Promise<Receipt[]> {
    const queryParams: Record<string, string | number | undefined> = {
      operation_type: 'receipt',
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

    let receipts = (operations || []).map((op) => this.mapOperationToReceipt(op, lookups));

    // Client-side search and location filtering
    if (params?.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      receipts = receipts.filter(
        (r) =>
          r.reference.toLowerCase().includes(term) ||
          r.supplier.toLowerCase().includes(term) ||
          r.destinationLocationName.toLowerCase().includes(term) ||
          r.items.some(
            (item) =>
              item.productName.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term)
          )
      );
    }

    if (params?.locationId) {
      receipts = receipts.filter((r) => r.destinationLocationId === params.locationId);
    }

    return receipts;
  }

  async getReceiptById(id: number): Promise<Receipt> {
    const [op, lookups] = await Promise.all([
      apiClient<BackendOperation>(`/operations/${id}`, { method: 'GET' }),
      this.loadLookups(),
    ]);
    return this.mapOperationToReceipt(op, lookups);
  }

  async createReceipt(input: CreateReceiptInput): Promise<Receipt> {
    const payload = {
      supplier: input.supplier.trim(),
      destination_location_id: Number(input.destinationLocationId),
      lines: input.lines.map((line) => ({
        product_id: Number(line.productId),
        quantity: Number(line.quantity),
      })),
    };

    let op = await apiClient<BackendOperation>('/operations/receipts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (input.validateImmediately) {
      op = await apiClient<BackendOperation>(`/operations/${op.id}/validate`, {
        method: 'POST',
      });
    }

    const lookups = await this.loadLookups();
    return this.mapOperationToReceipt(op, lookups);
  }

  async validateReceipt(id: number): Promise<Receipt> {
    const [op, lookups] = await Promise.all([
      apiClient<BackendOperation>(`/operations/${id}/validate`, {
        method: 'POST',
      }),
      this.loadLookups(),
    ]);
    return this.mapOperationToReceipt(op, lookups);
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
}

export const receiptService: IReceiptService = new FastApiReceiptService();
