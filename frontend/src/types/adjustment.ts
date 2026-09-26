/**
 * Inventory Adjustment Types matching FastAPI schemas:
 * - AdjustmentCreate
 * - AdjustmentLineCreate
 * - OperationResponse
 */

export type AdjustmentStatus = 'Draft' | 'Waiting' | 'Done' | 'Canceled';

export interface AdjustmentItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  category: string;
  unit: string;
  recordedStock: number;
  physicalCount: number;
  difference: number;
}

export interface Adjustment {
  id: number;
  reference: string;
  locationId: number;
  locationName: string;
  status: AdjustmentStatus;
  reason?: string | null;
  items: AdjustmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdjustmentLine {
  productId: number;
  physicalCount: number;
}

export interface CreateAdjustmentInput {
  locationId: number;
  lines: CreateAdjustmentLine[];
  reason?: string;
  validateImmediately?: boolean;
}

export interface AdjustmentFilterParams {
  search?: string;
  status?: string;
  locationId?: number;
  discrepancyType?: 'all' | 'positive' | 'negative' | 'neutral';
}

/**
 * Map backend operation status string ('draft', 'waiting', 'ready', 'done', 'cancelled')
 * to UI AdjustmentStatus ('Draft', 'Waiting', 'Done', 'Canceled').
 */
export function mapBackendStatusToAdjustmentStatus(backendStatus: string): AdjustmentStatus {
  const s = (backendStatus || '').trim().toLowerCase();
  if (s === 'done') return 'Done';
  if (s === 'waiting' || s === 'in_review') return 'Waiting';
  if (s === 'cancelled' || s === 'canceled') return 'Canceled';
  return 'Draft';
}
