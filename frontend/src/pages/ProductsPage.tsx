import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';
import { StateInspector, UiState } from '../components/common/StateInspector';
import { ProductMetrics } from '../components/products/ProductMetrics';
import { ProductFilterBar } from '../components/products/ProductFilterBar';
import { ProductTable } from '../components/products/ProductTable';
import { ProductCardView } from '../components/products/ProductCardView';
import { ProductModal } from '../components/products/ProductModal';
import { ProductDetailModal } from '../components/products/ProductDetailModal';
import { productService } from '../api/productService';
import { ProductWithStock, CreateProductInput, UpdateProductInput } from '../types/product';
import { BackendLocation } from '../types/delivery';

export const ProductsPage: React.FC = () => {
  const [uiState, setUiState] = useState<UiState>('live');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Products Data
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<BackendLocation[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductWithStock | null>(null);

  // Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Categories & Locations once
  useEffect(() => {
    let isMounted = true;
    Promise.all([productService.getCategories(), productService.getLocations()])
      .then(([cats, locs]) => {
        if (isMounted) {
          setCategories(cats);
          setLocations(locs);
        }
      })
      .catch((err) => console.warn('Failed to load lookup metadata:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live products
  const loadProducts = useCallback(async () => {
    try {
      const data = await productService.getProducts({
        search: searchTerm,
        category: selectedCategory,
        status: selectedStatus,
      });

      setProducts(data);
      setErrorMessage(null);
      setUiState((prev) => (prev === 'loading' || prev === 'error' ? 'live' : prev));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to FastAPI product catalog.';
      setErrorMessage(msg);
      setUiState('error');
    }
  }, [searchTerm, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle Retry
  const handleRetry = () => {
    setUiState('loading');
    setTimeout(() => {
      loadProducts();
    }, 400);
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setUiState('live');
  };

  // Create or Update Product
  const handleProductSubmit = async (
    input: CreateProductInput | (UpdateProductInput & { id: number })
  ) => {
    if ('id' in input && input.id) {
      await productService.updateProduct(input.id, input);
    } else {
      await productService.createProduct(input as CreateProductInput);
    }
    await loadProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Open Edit modal
  const handleEditProduct = (prod: ProductWithStock) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  // Open Add modal
  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (products.length === 0) {
      alert('No product records available to export.');
      return;
    }

    const headers = ['ID', 'Name', 'SKU', 'Category', 'Unit', 'Price', 'Stock On Hand', 'Reorder Level', 'Status', 'Location'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `"${p.category || ''}"`,
      p.unit_of_measure,
      p.price.toFixed(2),
      p.stockOnHand,
      p.reorder_level,
      p.status,
      `"${p.locationName || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense-products-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full pb-12 gap-6">
      {/* State Inspector ribbon matching Stitch reference */}
      <StateInspector currentState={uiState} onStateChange={setUiState} />

      {/* Operational Breadcrumbs & Telemetry */}
      <Breadcrumbs currentSection="Inventory" currentPageTitle="Products" />

      {/* Page Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-md">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Products
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage master products and monitor stock availability across active fulfillment zones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            type="button"
            onClick={() => alert('Point camera or handheld scanner to read product barcode.')}
            className="inline-flex items-center gap-2 h-9 px-space-md bg-surface-container-lowest text-on-surface rounded-xl shadow-sm hover:bg-surface-container transition-colors font-body-sm text-body-sm font-medium border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Scan Barcode</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 h-9 px-space-md bg-surface-container-lowest text-on-surface rounded-xl shadow-sm hover:bg-surface-container transition-colors font-body-sm text-body-sm font-medium border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleNewProduct}
            className="inline-flex items-center gap-2 h-9 px-space-lg bg-primary-container text-on-primary rounded-xl shadow-sm hover:bg-primary transition-all font-body-sm text-body-sm font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Product Summary KPI Metrics */}
      <ProductMetrics
        products={products}
        selectedStatus={selectedStatus}
        onStatusClick={(status) => setSelectedStatus(status)}
      />

      {/* Filter & Controls Toolbar */}
      <ProductFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        categories={categories}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
      />

      {/* LOADING STATE VIEW */}
      {uiState === 'loading' && (
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md animate-pulse border border-outline-variant/20">
          <div className="h-10 bg-surface-container rounded-lg w-full" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-container-low rounded-lg w-full" />
            ))}
          </div>
          <div className="h-10 bg-surface-container rounded-lg w-full mt-2" />
        </div>
      )}

      {/* ERROR STATE VIEW */}
      {uiState === 'error' && (
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center border border-outline-variant/20">
          <div className="w-16 h-16 rounded-full bg-error-container/40 flex items-center justify-center text-error mb-space-md">
            <span className="material-symbols-outlined text-[36px]">sync_problem</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">
            Failed to load product catalog
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-2">
            {errorMessage || 'FastAPI service reported a connection timeout while querying /products.'}
          </p>
          <span className="font-label-code text-label-code bg-surface-container text-error px-2.5 py-1 rounded mb-space-lg font-mono">
            ERR_CATALOG_SYNC
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 h-9 px-space-lg bg-surface-container text-on-surface rounded-xl font-medium shadow-sm hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* EMPTY STATE VIEW */}
      {uiState === 'empty' && (
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-16 flex flex-col items-center justify-center text-center border border-outline-variant/20">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-space-md">
            <span className="material-symbols-outlined text-[44px]">search_off</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">
            No products found matching filters
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            We couldn't find any products in your active fulfillment hubs matching the current parameters.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 h-9 px-space-lg bg-primary-container text-on-primary rounded-xl font-medium shadow-sm hover:bg-primary transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>Reset Filter Criteria</span>
            </button>
            <button
              type="button"
              onClick={handleNewProduct}
              className="inline-flex items-center gap-2 h-9 px-space-lg bg-surface-container text-on-surface rounded-xl font-medium shadow-sm hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Product</span>
            </button>
          </div>
        </div>
      )}

      {/* LIVE VIEW */}
      {uiState === 'live' && (
        <>
          {viewMode === 'table' ? (
            <ProductTable
              products={products}
              onEdit={handleEditProduct}
              onViewDetail={setViewingProduct}
            />
          ) : (
            <ProductCardView
              products={products}
              onEdit={handleEditProduct}
              onViewDetail={setViewingProduct}
            />
          )}
        </>
      )}

      {/* Add / Edit Slide-over Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductSubmit}
        editingProduct={editingProduct}
        locations={locations}
        categories={categories}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onEdit={handleEditProduct}
      />
    </div>
  );
};
