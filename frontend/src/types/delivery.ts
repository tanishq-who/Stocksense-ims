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
}

export interface CreateDeliveryInput {
  fromLocation: string;
  toDestination: string;
  contactName: string;
  contactRole?: string;
  scheduledDate: string;
  items: {
    productName: string;
    sku?: string;
    quantity: number;
    unit: string;
  }[];
  notes?: string;
  status?: DeliveryStatus;
}
