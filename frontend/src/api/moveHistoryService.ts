import { apiClient } from './client';
import {
  BackendStockLedgerEntry,
  MoveHistoryItem,
  MovementType,
  MoveHistoryFilterParams,
} from '../types/moveHistory';
import { BackendProduct, BackendLocation, BackendOperation } from '../types/delivery';

export interface BackendWarehouse {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  is_active: boolean;
}

export interface IMoveHistoryService {
  getMoveHistory(params?: MoveHistoryFilterParams): Promise<MoveHistoryItem[]>;
  getLocations(): Promise<BackendLocation[]>;
  getWarehouses(): Promise<BackendWarehouse[]>;
  getProducts(): Promise<BackendProduct[]>;
}

export class FastApiMoveHistoryService implements IMoveHistoryService {
  private async loadLookups(): Promise<{
    productMap: Map<number, BackendProduct>;
    locationMap: Map<number, BackendLocation>;
    warehouseMap: Map<number, BackendWarehouse>;
    operationMap: Map<number, BackendOperation>;
    operationRefMap: Map<string, BackendOperation>;
  }> {
    const [products, locations, warehouses, operations] = await Promise.all([
      apiClient<BackendProduct[]>('/products', { method: 'GET', params: { limit: 500 } }).catch(
        () => [] as BackendProduct[]
      ),
      apiClient<BackendLocation[]>('/api/locations', { method: 'GET', params: { limit: 200 } }).catch(
        () => [] as BackendLocation[]
      ),
      apiClient<BackendWarehouse[]>('/warehouses', { method: 'GET', params: { limit: 100 } }).catch(
        () => [] as BackendWarehouse[]
      ),
      apiClient<BackendOperation[]>('/operations', { method: 'GET', params: { limit: 500 } }).catch(
        () => [] as BackendOperation[]
      ),
    ]);

    const productMap = new Map<number, BackendProduct>();
    products.forEach((p) => productMap.set(p.id, p));

    const locationMap = new Map<number, BackendLocation>();
    locations.forEach((l) => locationMap.set(l.id, l));

    const warehouseMap = new Map<number, BackendWarehouse>();
    warehouses.forEach((w) => warehouseMap.set(w.id, w));

    const operationMap = new Map<number, BackendOperation>();
    const operationRefMap = new Map<string, BackendOperation>();
    operations.forEach((op) => {
      operationMap.set(op.id, op);
      if (op.reference) {
        operationRefMap.set(op.reference.trim().toUpperCase(), op);
      }
    });

    return { productMap, locationMap, warehouseMap, operationMap, operationRefMap };
  }

  private detectMovementType(reference: string, operation?: BackendOperation): MovementType {
    if (operation?.operation_type) {
      const opType = operation.operation_type.toLowerCase();
      if (opType === 'receipt') return 'receipt';
      if (opType === 'delivery') return 'delivery';
      if (opType === 'transfer') return 'transfer';
      if (opType === 'adjustment') return 'adjustment';
    }

    const refUpper = (reference || '').trim().toUpperCase();
    if (refUpper.startsWith('REC')) return 'receipt';
    if (refUpper.startsWith('DEL')) return 'delivery';
    if (refUpper.startsWith('TRF')) return 'transfer';
    if (refUpper.startsWith('ADJ')) return 'adjustment';

    return 'transfer';
  }

  private getMovementTypeLabel(type: MovementType): string {
    switch (type) {
      case 'receipt':
        return 'Receipt';
      case 'delivery':
        return 'Delivery';
      case 'transfer':
        return 'Internal Transfer';
      case 'adjustment':
        return 'Stock Adjustment';
      default:
        return 'Stock Movement';
    }
  }

  private mapLedgerEntryToItem(
    entry: BackendStockLedgerEntry,
    lookups: {
      productMap: Map<number, BackendProduct>;
      locationMap: Map<number, BackendLocation>;
      warehouseMap: Map<number, BackendWarehouse>;
      operationMap: Map<number, BackendOperation>;
      operationRefMap: Map<string, BackendOperation>;
    }
  ): MoveHistoryItem {
    const product = lookups.productMap.get(entry.product_id);
    const location = lookups.locationMap.get(entry.location_id);
    const warehouse = location?.warehouse_id ? lookups.warehouseMap.get(location.warehouse_id) : undefined;

    // Resolve linked operation
    const op = entry.operation_id
      ? lookups.operationMap.get(entry.operation_id)
      : lookups.operationRefMap.get(entry.operation_reference?.trim().toUpperCase());

    const movementType = this.detectMovementType(entry.operation_reference, op);
    const movementTypeLabel = this.getMovementTypeLabel(movementType);

    const locName = location?.name || `Location #${entry.location_id}`;
    const whPrefix = warehouse?.name ? `${warehouse.name} / ` : '';
    const fullLocName = `${whPrefix}${locName}`;

    let fromLoc = '—';
    let toLoc = '—';
    let operatorOrContact: string | undefined = undefined;

    if (movementType === 'receipt') {
      const supplierName = op?.supplier?.trim();
      fromLoc = supplierName ? `Supplier (${supplierName})` : 'Vendor / Inbound';
      toLoc = fullLocName;
      operatorOrContact = supplierName || 'Receiving Team';
    } else if (movementType === 'delivery') {
      const customerName = op?.customer?.trim();
      fromLoc = fullLocName;
      toLoc = customerName ? `Customer (${customerName})` : 'Outbound Dispatch';
      operatorOrContact = customerName || 'Dispatch Team';
    } else if (movementType === 'transfer') {
      const srcLoc = op?.source_location_id ? lookups.locationMap.get(op.source_location_id) : undefined;
      const dstLoc = op?.destination_location_id ? lookups.locationMap.get(op.destination_location_id) : undefined;

      const srcName = srcLoc ? srcLoc.name : (op?.source_location_id ? `Location #${op.source_location_id}` : 'Source Location');
      const dstName = dstLoc ? dstLoc.name : (op?.destination_location_id ? `Location #${op.destination_location_id}` : 'Destination Location');

      if (entry.delta < 0) {
        // Outbound movement from source
        fromLoc = fullLocName;
        toLoc = dstName;
      } else {
        // Inbound movement to destination
        fromLoc = srcName;
        toLoc = fullLocName;
      }
      operatorOrContact = 'Transfer Operator';
    } else if (movementType === 'adjustment') {
      if (entry.delta > 0) {
        fromLoc = 'Inventory Count (Gain)';
        toLoc = fullLocName;
      } else if (entry.delta < 0) {
        fromLoc = fullLocName;
        toLoc = 'Inventory Discrepancy (Loss)';
      } else {
        fromLoc = fullLocName;
        toLoc = `${fullLocName} (Audit Verified)`;
      }
      operatorOrContact = op?.reason || entry.reason || 'Cycle Count Auditor';
    }

    return {
      id: entry.id,
      reference: entry.operation_reference,
      timestamp: entry.timestamp,
      movementType,
      movementTypeLabel,
      productId: entry.product_id,
      productName: product ? product.name : `Product #${entry.product_id}`,
      sku: product ? product.sku : `SKU-${entry.product_id}`,
      category: product?.category || undefined,
      unitOfMeasure: product?.unit_of_measure || 'pcs',
      locationId: entry.location_id,
      locationName: fullLocName,
      warehouseId: warehouse?.id,
      warehouseName: warehouse?.name,
      fromLocation: fromLoc,
      toLocation: toLoc,
      delta: entry.delta,
      balanceAfter: entry.balance_after,
      reason: entry.reason || op?.reason || null,
      status: 'Done',
      operationId: entry.operation_id || op?.id,
      operatorOrContact,
    };
  }

  async getMoveHistory(params?: MoveHistoryFilterParams): Promise<MoveHistoryItem[]> {
    const apiParams: Record<string, string | number | undefined> = {
      limit: 500,
    };

    if (params?.locationId) {
      apiParams.location_id = params.locationId;
    }

    const [entries, lookups] = await Promise.all([
      apiClient<BackendStockLedgerEntry[]>('/ledger', {
        method: 'GET',
        params: apiParams,
      }),
      this.loadLookups(),
    ]);

    const items = entries.map((e) => this.mapLedgerEntryToItem(e, lookups));

    // Sort by timestamp descending (newest first), then by id descending
    return items.sort((a, b) => {
      const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.id - a.id;
    });
  }

  async getLocations(): Promise<BackendLocation[]> {
    return apiClient<BackendLocation[]>('/api/locations', {
      method: 'GET',
      params: { limit: 200 },
    }).catch(() => []);
  }

  async getWarehouses(): Promise<BackendWarehouse[]> {
    return apiClient<BackendWarehouse[]>('/warehouses', {
      method: 'GET',
      params: { limit: 100 },
    }).catch(() => []);
  }

  async getProducts(): Promise<BackendProduct[]> {
    return apiClient<BackendProduct[]>('/products', {
      method: 'GET',
      params: { limit: 500 },
    }).catch(() => []);
  }
}

export const moveHistoryService = new FastApiMoveHistoryService();
