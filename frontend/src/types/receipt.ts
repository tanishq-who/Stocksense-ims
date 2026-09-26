/**
 * Receipt Types matching FastAPI OperationResponse and ReceiptCreate schemas
 */

export type ReceiptStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';

export interface ReceiptItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
}

export interface Receipt {
  id: number;
  reference: string;
  supplier: string;
  destinationLocationId: number;
  destinationLocationName: string;
  status: ReceiptStatus;
  scheduledDate?: string | null;
  items: ReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceiptInput {
  supplier: string;
  destinationLocationId: number;
  lines: {
    productId: number;
    quantity: number;
  }[];
  scheduledDate?: string;
  validateImmediately?: boolean;
}

export interface ReceiptFilterParams {
  search?: string;
  status?: string;
  locationId?: number;
}

/**
 * Map backend operation status string ('draft', 'waiting', 'ready', 'done', 'cancelled')
 * to UI ReceiptStatus ('Draft', 'Waiting', 'Ready', 'Done', 'Canceled').
 */
export function mapBackendStatusToReceiptStatus(backendStatus: string): ReceiptStatus {
  const s = (backendStatus || '').trim().toLowerCase();
  if (s === 'ready') return 'Ready';
  if (s === 'waiting') return 'Waiting';
  if (s === 'done') return 'Done';
  if (s === 'cancelled' || s === 'canceled') return 'Canceled';
  return 'Draft';
}
