import { apiClient } from './client';
import {
  Product,
  ProductWithStock,
  CreateProductInput,
  UpdateProductInput,
  StockLevel,
  ProductFilterParams,
  ProductStockStatus,
} from '../types/product';
import { BackendLocation } from '../types/delivery';

export interface IProductService {
  getProducts(params?: ProductFilterParams): Promise<ProductWithStock[]>;
  getProductById(id: number): Promise<Product>;
  createProduct(input: CreateProductInput): Promise<Product>;
  updateProduct(id: number, input: UpdateProductInput): Promise<Product>;
  getCategories(): Promise<string[]>;
  getLocations(): Promise<BackendLocation[]>;
}

export class FastApiProductService implements IProductService {
  async getProducts(params?: ProductFilterParams): Promise<ProductWithStock[]> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.category && params.category.toLowerCase() !== 'all') {
      queryParams.category = params.category;
    }

    // Fetch products, stock levels, and locations in parallel
    const [products, stockLevels, locations] = await Promise.all([
      apiClient<Product[]>('/products', { method: 'GET', params: queryParams }),
      apiClient<StockLevel[]>('/api/stock-levels', { method: 'GET', params: { limit: 500 } }).catch(
        () => [] as StockLevel[]
      ),
      apiClient<BackendLocation[]>('/api/locations', { method: 'GET', params: { limit: 200 } }).catch(
        () => [] as BackendLocation[]
      ),
    ]);

    // Build location lookup map
    const locationMap = new Map<number, string>();
    locations.forEach((loc) => {
      locationMap.set(loc.id, loc.name);
    });

    // Aggregate stock by product_id
    const productStockMap = new Map<
      number,
      { totalQty: number; reservedQty: number; locationId?: number; locationName?: string }
    >();

    stockLevels.forEach((sl) => {
      const existing = productStockMap.get(sl.product_id) || {
        totalQty: 0,
        reservedQty: 0,
      };
      existing.totalQty += sl.quantity || 0;
      existing.reservedQty += sl.reserved_quantity || 0;
      if (!existing.locationId && sl.location_id) {
        existing.locationId = sl.location_id;
        existing.locationName = locationMap.get(sl.location_id) || `Location #${sl.location_id}`;
      }
      productStockMap.set(sl.product_id, existing);
    });

    // Map each product to ProductWithStock
    let results: ProductWithStock[] = (products || []).map((p) => {
      const stockInfo = productStockMap.get(p.id) || { totalQty: 0, reservedQty: 0 };
      const stockOnHand = stockInfo.totalQty;
      const reservedStock = stockInfo.reservedQty;
      const availableStock = Math.max(0, stockOnHand - reservedStock);

      let status: ProductStockStatus = 'In Stock';
      if (availableStock <= 0) {
        status = 'Out of Stock';
      } else if (p.reorder_level > 0 && availableStock <= p.reorder_level) {
        status = 'Low Stock';
      }

      return {
        ...p,
        stockOnHand,
        reservedStock,
        availableStock,
        locationId: stockInfo.locationId,
        locationName: stockInfo.locationName || 'General Staging',
        status,
      };
    });

    // Apply status filter if provided
    if (params?.status && params.status.toLowerCase() !== 'all') {
      const targetStatus = params.status.toLowerCase();
      results = results.filter((p) => p.status.toLowerCase() === targetStatus);
    }

    return results;
  }

  async getProductById(id: number): Promise<Product> {
    return apiClient<Product>(`/products/${id}`, { method: 'GET' });
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const productPayload = {
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      price: input.price !== undefined ? Number(input.price) : 0.0,
      unit_of_measure: input.unit_of_measure.trim(),
      reorder_level: input.reorder_level !== undefined ? Number(input.reorder_level) : 0.0,
    };

    const createdProduct = await apiClient<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productPayload),
    });

    // If initial stock and location were provided, record stock level
    if (input.initialStock && input.initialStock > 0 && input.locationId) {
      try {
        await apiClient<StockLevel>('/api/stock-levels', {
          method: 'POST',
          body: JSON.stringify({
            product_id: createdProduct.id,
            location_id: input.locationId,
            quantity: Number(input.initialStock),
            reserved_quantity: 0.0,
            reorder_threshold: input.reorder_level ? Number(input.reorder_level) : 10.0,
          }),
        });
      } catch (err) {
        console.warn('Initial stock level registration failed:', err);
      }
    }

    return createdProduct;
  }

  async updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
    const updatePayload: Record<string, any> = {};
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.sku !== undefined) updatePayload.sku = input.sku.trim().toUpperCase();
    if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
    if (input.category !== undefined) updatePayload.category = input.category?.trim() || null;
    if (input.price !== undefined) updatePayload.price = Number(input.price);
    if (input.unit_of_measure !== undefined) updatePayload.unit_of_measure = input.unit_of_measure.trim();
    if (input.reorder_level !== undefined) updatePayload.reorder_level = Number(input.reorder_level);

    return apiClient<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload),
    });
  }

  async getCategories(): Promise<string[]> {
    try {
      const products = await apiClient<Product[]>('/products', { method: 'GET' });
      const cats = new Set<string>();
      (products || []).forEach((p) => {
        if (p.category && p.category.trim()) {
          cats.add(p.category.trim());
        }
      });
      return Array.from(cats);
    } catch {
      return ['Electronics', 'Packaging', 'Hardware', 'Raw Materials', 'Chemical'];
    }
  }

  async getLocations(): Promise<BackendLocation[]> {
    try {
      const locations = await apiClient<BackendLocation[]>('/api/locations', { method: 'GET' });
      return locations || [];
    } catch {
      return [];
    }
  }
}

export const productService: IProductService = new FastApiProductService();
