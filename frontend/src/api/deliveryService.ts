import {
  Delivery,
  CreateDeliveryInput,
  DeliveryStatus,
  BackendOperation,
  BackendLocation,
  BackendProduct,
  mapBackendStatusToDeliveryStatus,
} from '../types/delivery';
import { DeliveryFilterParams, PaginatedResponse } from '../types/api';
import { apiClient } from './client';

/**
 * Delivery Service Interface.
 * Connected directly to the FastAPI + SQLite backend.
 */
export interface IDeliveryService {
  getDeliveries(params?: DeliveryFilterParams): Promise<PaginatedResponse<Delivery>>;
  getDeliveryById(id: string): Promise<Delivery>;
  createDelivery(input: CreateDeliveryInput): Promise<Delivery>;
  validateDelivery(id: string): Promise<Delivery>;
  getLocations(): Promise<BackendLocation[]>;
  getProducts(): Promise<BackendProduct[]>;
}

/**
 * Real FastAPI Delivery Service connecting to StockSense backend endpoints:
 * - GET /operations?operation_type=delivery
 * - GET /operations/{id}
 * - POST /operations/deliveries
 * - POST /operations/{id}/validate
 * - GET /api/locations
 * - GET /products
 */
export class FastApiDeliveryService implements IDeliveryService {
  private locationsCache: Map<number, BackendLocation> | null = null;
  private productsCache: Map<number, BackendProduct> | null = null;

  async getLocations(): Promise<BackendLocation[]> {
    try {
      const locations = await apiClient<BackendLocation[]>('/api/locations');
      this.locationsCache = new Map(locations.map((loc) => [loc.id, loc]));
      return locations;
    } catch {
      return [];
    }
  }

  async getProducts(): Promise<BackendProduct[]> {
    try {
      const products = await apiClient<BackendProduct[]>('/products');
      this.productsCache = new Map(products.map((prod) => [prod.id, prod]));
      return products;
    } catch {
      return [];
    }
  }

  private async ensureLookupsLoaded(): Promise<void> {
    const promises: Promise<unknown>[] = [];
    if (!this.locationsCache) promises.push(this.getLocations());
    if (!this.productsCache) promises.push(this.getProducts());
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  private mapOperationToDelivery(op: BackendOperation): Delivery {
    const loc = op.source_location_id ? this.locationsCache?.get(op.source_location_id) : undefined;
    const fromLocation = loc ? loc.name : op.source_location_id ? `Location #${op.source_location_id}` : 'Main Warehouse';
    const customer = (op.customer || '').trim();
    const contactName = customer || 'Dispatch Lead';

    const initials = contactName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'DL';

    const items = (op.lines || []).map((line, idx) => {
      const prod = this.productsCache?.get(line.product_id);
      return {
        id: String(line.id || `line-${idx}`),
        productName: prod?.name || `Product #${line.product_id}`,
        sku: prod?.sku || `SKU-${line.product_id}`,
        quantity: line.quantity,
        unit: prod?.unit_of_measure || 'Units',
      };
    });

    return {
      id: String(op.id),
      reference: op.reference,
      fromLocation,
      toDestination: customer || 'Customer Site',
      contactName,
      contactRole: 'Outbound Courier',
      contactInitials: initials,
      scheduledDate: op.scheduled_date || op.created_at,
      status: mapBackendStatusToDeliveryStatus(op.status),
      items,
      notes: op.reason || undefined,
      createdAt: op.created_at,
      updatedAt: op.updated_at,
      sourceLocationId: op.source_location_id || undefined,
    };
  }


  async getDeliveries(params?: DeliveryFilterParams): Promise<PaginatedResponse<Delivery>> {
    // 1. Ensure lookup tables (locations, products) are available
    await this.ensureLookupsLoaded();

    // 2. Fetch operations of type 'delivery' from real FastAPI backend
    // Endpoint: GET /operations?operation_type=delivery
    const operations = await apiClient<BackendOperation[]>('/operations', {
      params: {
        operation_type: 'delivery',
        limit: 500,
      },
    });

    // 3. Map backend operations to UI Delivery models
    let mapped = operations.map((op) => this.mapOperationToDelivery(op));

    // 4. Apply search filter
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      mapped = mapped.filter(
        (d) =>
          d.reference.toLowerCase().includes(q) ||
          d.fromLocation.toLowerCase().includes(q) ||
          d.toDestination.toLowerCase().includes(q) ||
          d.contactName.toLowerCase().includes(q) ||
          d.items.some((it) => it.productName.toLowerCase().includes(q) || (it.sku && it.sku.toLowerCase().includes(q)))
      );
    }

    // 5. Apply status filter
    if (params?.status && params.status !== 'All') {
      const targetStatus = params.status.toLowerCase();
      mapped = mapped.filter((d) => d.status.toLowerCase() === targetStatus);
    }

    // 6. Apply warehouse filter
    if (params?.warehouse && params.warehouse !== 'All') {
      const targetWh = params.warehouse.toLowerCase();
      mapped = mapped.filter((d) => d.fromLocation.toLowerCase().includes(targetWh));
    }

    // 7. Paginate results
    const page = params?.page && params.page > 0 ? params.page : 1;
    const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 20;
    const total = mapped.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const items = mapped.slice((page - 1) * pageSize, page * pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getDeliveryById(id: string): Promise<Delivery> {
    await this.ensureLookupsLoaded();
    const op = await apiClient<BackendOperation>(`/operations/${id}`);
    return this.mapOperationToDelivery(op);
  }

  async createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
    const customer = (input.contactName || input.toDestination || 'Customer Delivery').trim();
    const sourceLocationId = input.sourceLocationId || 1;

    let scheduledDateIso: string | undefined;
    if (input.scheduledDate) {
      try {
        scheduledDateIso = new Date(input.scheduledDate).toISOString();
      } catch {
        scheduledDateIso = new Date().toISOString();
      }
    }

    const payload = {
      customer,
      source_location_id: sourceLocationId,
      scheduled_date: scheduledDateIso,
      lines: input.items.map((item) => ({
        product_id: item.productId || 1,
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
    };

    const createdOp = await apiClient<BackendOperation>('/operations/deliveries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await this.ensureLookupsLoaded();
    return this.mapOperationToDelivery(createdOp);
  }

  async validateDelivery(id: string): Promise<Delivery> {
    const validatedOp = await apiClient<BackendOperation>(`/operations/${id}/validate`, {
      method: 'POST',
    });
    await this.ensureLookupsLoaded();
    return this.mapOperationToDelivery(validatedOp);
  }
}

// Export the active service instance connected to the real FastAPI backend
export const deliveryService: IDeliveryService = new FastApiDeliveryService();

