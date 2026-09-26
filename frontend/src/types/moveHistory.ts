/**
 * Stock Ledger / Move History Types
 * Mapped from FastAPI backend /ledger and enriched with product, location, and operation data.
 */

import { BackendProduct, BackendLocation, BackendOperation } from './delivery';

/**
 * Raw FastAPI Stock Ledger Entry matching StockLedgerEntryResponse
 */
export interface BackendStockLedgerEntry {
  id: number;
  product_id: number;
  location_id: number;
  operation_id?: number | null;
  operation_reference: string;
  delta: number;
  balance_after: number;
  reason?: string | null;
  timestamp: string; // ISO 8601 UTC timestamp
}

/**
 * Supported movement types in StockSense
 */
export type MovementType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';

/**
 * Enriched Move History Item for table and card views
 */
export interface MoveHistoryItem {
  id: number; // Ledger entry ID
  reference: string; // e.g. "REC-00001", "DEL-00001", "TRF-00001", "ADJ-00001"
  timestamp: string;
  movementType: MovementType;
  movementTypeLabel: string;
  productId: number;
  productName: string;
  sku: string;
  category?: string;
  unitOfMeasure: string;
  locationId: number;
  locationName: string;
  warehouseId?: number;
  warehouseName?: string;
  fromLocation: string;
  toLocation: string;
  delta: number; // positive = added, negative = removed, 0 = verified
  balanceAfter: number;
  reason?: string | null;
  status: 'Done'; // All posted stock ledger entries are immutable & completed
  operationId?: number | null;
  operatorOrContact?: string;
}

/**
 * Move History filter parameters
 */
export interface MoveHistoryFilterParams {
  searchTerm?: string;
  movementType?: string; // 'all' | 'receipt' | 'delivery' | 'transfer' | 'adjustment'
  locationId?: number;
  warehouseId?: number;
  dateRange?: 'all' | 'today' | '7days' | '30days';
  startDate?: string;
  endDate?: string;
}

/**
 * Aggregated summary metrics for Move History KPI cards
 */
export interface MoveHistoryMetricsData {
  totalMoves: number;
  incomingCount: number;
  outgoingCount: number;
  transferCount: number;
  adjustmentCount: number;
  totalUnitsAdded: number;
  totalUnitsRemoved: number;
}
