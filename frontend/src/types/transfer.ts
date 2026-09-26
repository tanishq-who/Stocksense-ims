/**
 * Internal Transfer Types matching FastAPI TransferCreate and OperationResponse schemas
 */

export type TransferStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';

export interface TransferItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
}

export interface Transfer {
  id: number;
  reference: string;
  sourceLocationId: number;
  sourceLocationName: string;
  destinationLocationId: number;
  destinationLocationName: string;
  status: TransferStatus;
  scheduledDate?: string | null;
  items: TransferItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferLine {
  productId: number;
  quantity: number;
}

export interface CreateTransferInput {
  sourceLocationId: number;
  destinationLocationId: number;
  scheduledDate?: string;
  lines: CreateTransferLine[];
  validateImmediately?: boolean;
}

export interface TransferFilterParams {
  search?: string;
  status?: string;
  sourceLocationId?: number;
  destinationLocationId?: number;
}

export interface InsufficientStockItem {
  product_id: number;
  product_name: string;
  sku: string;
  requested_quantity: number;
  available_quantity: number;
  shortage: number;
}

export interface ValidationErrorResponse {
  message?: string;
  insufficient_items?: InsufficientStockItem[];
}

/**
 * Map backend operation status string ('draft', 'waiting', 'ready', 'done', 'cancelled')
 * to UI TransferStatus ('Draft', 'Waiting', 'Ready', 'Done', 'Canceled').
 */
export function mapBackendStatusToTransferStatus(backendStatus: string): TransferStatus {
  const s = (backendStatus || '').trim().toLowerCase();
  if (s === 'ready') return 'Ready';
  if (s === 'waiting') return 'Waiting';
  if (s === 'done') return 'Done';
  if (s === 'cancelled' || s === 'canceled') return 'Canceled';
  return 'Draft';
}
