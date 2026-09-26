import { Delivery, CreateDeliveryInput, DeliveryStatus } from '../types/delivery';
import { DeliveryFilterParams, PaginatedResponse } from '../types/api';
import { apiClient } from './client';

/**
 * Delivery Service Interface.
 * Concrete implementation will connect directly to FastAPI once endpoints are finalized.
 */
export interface IDeliveryService {
  getDeliveries(params?: DeliveryFilterParams): Promise<PaginatedResponse<Delivery>>;
  getDeliveryById(id: string): Promise<Delivery>;
  createDelivery(input: CreateDeliveryInput): Promise<Delivery>;
  updateDeliveryStatus(id: string, status: DeliveryStatus): Promise<Delivery>;
}

/**
 * Real API Delivery Service (staged for FastAPI connection).
 * Uncomment and adjust endpoint paths once FastAPI router contracts are defined.
 */
export class FastApiDeliveryService implements IDeliveryService {
  async getDeliveries(params?: DeliveryFilterParams): Promise<PaginatedResponse<Delivery>> {
    return apiClient<PaginatedResponse<Delivery>>('/api/deliveries', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getDeliveryById(id: string): Promise<Delivery> {
    return apiClient<Delivery>(`/api/deliveries/${id}`);
  }

  async createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
    return apiClient<Delivery>('/api/deliveries', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateDeliveryStatus(id: string, status: DeliveryStatus): Promise<Delivery> {
    return apiClient<Delivery>(`/api/deliveries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

/**
 * Seed data matching Google Stitch Delivery reference designs (delivery_operations_1 & 2)
 */
const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: 'del-001',
    reference: 'WH/OUT/0001',
    fromLocation: 'Main Warehouse',
    toDestination: 'Customer Location',
    contactName: 'Ravi Kumar',
    contactRole: 'Lead Courier',
    contactInitials: 'RK',
    scheduledDate: '26 Sep 2026',
    status: 'Ready',
    items: [
      { id: 'item-1', productName: 'Steel Bearing Assembly', sku: 'SBA-1002', quantity: 240, unit: 'Units' },
      { id: 'item-2', productName: 'Hydraulic Seal Kit', sku: 'HSK-440', quantity: 50, unit: 'Kits' },
    ],
    notes: 'Gate 3 loading bay - priority dispatch',
  },
  {
    id: 'del-002',
    reference: 'WH/OUT/0002',
    fromLocation: 'Warehouse 2',
    toDestination: 'Customer Location',
    contactName: 'Ananya',
    contactRole: 'Logistics Mgr',
    contactInitials: 'AN',
    scheduledDate: '27 Sep 2026',
    status: 'Waiting',
    items: [
      { id: 'item-3', productName: 'Industrial Control Valve', sku: 'ICV-99', quantity: 15, unit: 'Units' },
    ],
    notes: 'Awaiting dock inspection clearance',
  },
  {
    id: 'del-003',
    reference: 'WH/OUT/0003',
    fromLocation: 'Central Depot',
    toDestination: 'West Retail Store',
    contactName: 'Vikram Shah',
    contactRole: 'Regional Dist.',
    contactInitials: 'VS',
    scheduledDate: '28 Sep 2026',
    status: 'Ready',
    items: [
      { id: 'item-4', productName: 'Heavy Duty Conveyor Belt', sku: 'CB-880', quantity: 8, unit: 'Rolls' },
    ],
  },
  {
    id: 'del-004',
    reference: 'WH/OUT/0004',
    fromLocation: 'Main Warehouse',
    toDestination: 'Client Site B',
    contactName: 'Priya Sharma',
    contactRole: 'Inventory Spec',
    contactInitials: 'PS',
    scheduledDate: '28 Sep 2026',
    status: 'Draft',
    items: [
      { id: 'item-5', productName: 'Lithium Battery Pack 48V', sku: 'LBP-48', quantity: 120, unit: 'Packs' },
    ],
  },
  {
    id: 'del-005',
    reference: 'WH/OUT/0005',
    fromLocation: 'Cold Storage Hub',
    toDestination: 'Metro Mart East',
    contactName: 'Marcus Lee',
    contactRole: 'Carrier Driver',
    contactInitials: 'ML',
    scheduledDate: '25 Sep 2026',
    status: 'Done',
    items: [
      { id: 'item-6', productName: 'Thermal Insulated Containers', sku: 'TIC-12', quantity: 60, unit: 'Units' },
    ],
  },
  {
    id: 'del-006',
    reference: 'WH/OUT/0006',
    fromLocation: 'Warehouse 2',
    toDestination: 'TechCorp Logistics',
    contactName: 'Rajesh Sen',
    contactRole: 'Canceled Req',
    contactInitials: 'RS',
    scheduledDate: '24 Sep 2026',
    status: 'Canceled',
    items: [
      { id: 'item-7', productName: 'Electronic Sensor Module', sku: 'ESM-01', quantity: 400, unit: 'Pieces' },
    ],
  },
];

/**
 * Temporary development service implementing IDeliveryService.
 * Clearly identified demo state used only where necessary to render the Stitch design
 * until FastAPI endpoint contracts are provided.
 */
export class MockDevelopmentDeliveryService implements IDeliveryService {
  private deliveries: Delivery[] = [...INITIAL_DELIVERIES];

  async getDeliveries(params?: DeliveryFilterParams): Promise<PaginatedResponse<Delivery>> {
    // Artificial mini-delay to allow natural UI responsiveness
    await new Promise((r) => setTimeout(r, 60));

    let filtered = [...this.deliveries];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.reference.toLowerCase().includes(q) ||
          d.fromLocation.toLowerCase().includes(q) ||
          d.toDestination.toLowerCase().includes(q) ||
          d.contactName.toLowerCase().includes(q)
      );
    }

    if (params?.status && params.status !== 'All') {
      filtered = filtered.filter((d) => d.status.toLowerCase() === params.status?.toLowerCase());
    }

    if (params?.warehouse && params.warehouse !== 'All') {
      filtered = filtered.filter((d) => d.fromLocation.toLowerCase().includes(params.warehouse!.toLowerCase()));
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getDeliveryById(id: string): Promise<Delivery> {
    const item = this.deliveries.find((d) => d.id === id);
    if (!item) throw new Error(`Delivery not found: ${id}`);
    return item;
  }

  async createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
    const nextNum = (this.deliveries.length + 1).toString().padStart(4, '0');
    const initials = input.contactName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'OP';

    const newDelivery: Delivery = {
      id: `del-${Date.now()}`,
      reference: `WH/OUT/${nextNum}`,
      fromLocation: input.fromLocation,
      toDestination: input.toDestination,
      contactName: input.contactName,
      contactRole: input.contactRole || 'Operator',
      contactInitials: initials,
      scheduledDate: input.scheduledDate,
      status: input.status || 'Draft',
      items: input.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productName: it.productName,
        sku: it.sku || `SKU-${idx + 100}`,
        quantity: it.quantity,
        unit: it.unit || 'Units',
      })),
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    this.deliveries = [newDelivery, ...this.deliveries];
    return newDelivery;
  }

  async updateDeliveryStatus(id: string, status: DeliveryStatus): Promise<Delivery> {
    const item = this.deliveries.find((d) => d.id === id);
    if (!item) throw new Error(`Delivery not found: ${id}`);
    item.status = status;
    return item;
  }
}

// Export the active service instance (currently MockDevelopmentDeliveryService for UI demo,
// will switch to FastApiDeliveryService once FastAPI backend endpoints are connected)
export const deliveryService: IDeliveryService = new MockDevelopmentDeliveryService();
