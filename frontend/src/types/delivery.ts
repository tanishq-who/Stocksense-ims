export type DeliveryStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';

export interface DeliveryItem {
  id: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
}

export interface Delivery {
  id: string;
  reference: string;
  fromLocation: string;
  toDestination: string;
  contactName: string;
  contactRole: string;
  contactInitials: string;
  scheduledDate: string;
  status: DeliveryStatus;
  items: DeliveryItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  sourceLocationId?: number;
}

export interface CreateDeliveryInput {
  fromLocation: string;
  toDestination: string;
  contactName: string;
  contactRole?: string;
  scheduledDate: string;
  sourceLocationId?: number;
  items: {
    productId?: number;
    productName: string;
    sku?: string;
    quantity: number;
    unit: string;
  }[];
  notes?: string;
  status?: DeliveryStatus;
}

/**
 * FastAPI Backend Operation Line Schema matching OperationLineResponse
 */
export interface BackendOperationLine {
  id: number;
  operation_id: number;
  product_id: number;
  quantity: number;
  physical_count?: number | null;
}

/**
 * FastAPI Backend Operation Schema matching OperationResponse
 */
export interface BackendOperation {
  id: number;
  reference: string;
  operation_type: string;
  status: string;
  supplier?: string | null;
  customer?: string | null;
  location_id?: number | null;
  source_location_id?: number | null;
  destination_location_id?: number | null;
  scheduled_date?: string | null;
  reason?: string | null;
  lines: BackendOperationLine[];
  created_at: string;
  updated_at: string;
}

/**
 * FastAPI Backend Location Schema matching LocationResponse
 */
export interface BackendLocation {
  id: number;
  warehouse_id: number;
  name: string;
  code?: string | null;
  location_type: string;
}

/**
 * FastAPI Backend Product Schema matching ProductResponse
 */
export interface BackendProduct {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  category?: string | null;
  price: number;
  unit_of_measure: string;
  reorder_level: number;
}

/**
 * Map backend operation status string ('draft', 'done', 'cancelled', etc.)
 * to frontend UI DeliveryStatus ('Draft', 'Waiting', 'Ready', 'Done', 'Canceled').
 */
export function mapBackendStatusToDeliveryStatus(backendStatus: string): DeliveryStatus {
  const s = (backendStatus || '').trim().toLowerCase();
  if (s === 'ready') return 'Ready';
  if (s === 'waiting') return 'Waiting';
  if (s === 'done') return 'Done';
  if (s === 'canceled' || s === 'cancelled') return 'Canceled';
  return 'Draft';
}

