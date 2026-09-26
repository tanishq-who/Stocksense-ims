import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';
import { StateInspector, UiState } from '../components/common/StateInspector';
import { DashboardMetrics } from '../components/dashboard/DashboardMetrics';
import { DashboardFilterBar } from '../components/dashboard/DashboardFilterBar';
import { InventoryHealthOverview } from '../components/dashboard/InventoryHealthOverview';
import { RecentOperationsTable } from '../components/dashboard/RecentOperationsTable';
import { StockAlertsCard } from '../components/dashboard/StockAlertsCard';
import { NodeTelemetryCard } from '../components/dashboard/NodeTelemetryCard';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { NewDeliveryModal } from '../components/delivery/NewDeliveryModal';
import { dashboardService } from '../api/dashboardService';
import { deliveryService } from '../api/deliveryService';
import { DashboardResponse, Warehouse } from '../types/dashboard';
import { CreateDeliveryInput } from '../types/delivery';

export const DashboardPage: React.FC = () => {
  const [uiState, setUiState] = useState<UiState>('live');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Filter states
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load lookup options (warehouses, categories) once
  useEffect(() => {
    let isMounted = true;
    Promise.all([dashboardService.getWarehouses(), dashboardService.getCategories()])
      .then(([whs, cats]) => {
        if (isMounted) {
          setWarehouses(whs);
          setCategories(cats);
        }
      })
      .catch((err) => console.warn('Could not load lookup values:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real Dashboard metrics & operations from FastAPI backend
  const loadDashboardData = useCallback(async () => {
    try {
      const data = await dashboardService.getDashboard({
        operation_type: selectedType,
        status: selectedStatus,
        warehouse_id: selectedWarehouseId,
        category: selectedCategory,
      });

      setDashboardData(data);
      setErrorMessage(null);
      setUiState((prev) => (prev === 'loading' || prev === 'error' ? 'live' : prev));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to FastAPI backend.';
      setErrorMessage(msg);
      setUiState('error');
    }
  }, [selectedType, selectedStatus, selectedWarehouseId, selectedCategory]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle retry
  const handleRetry = () => {
    setUiState('loading');
    setTimeout(() => {
      loadDashboardData();
    }, 400);
  };

  // Reset filters
  const handleClearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedWarehouseId(undefined);
    setSelectedCategory('all');
    setSearchTerm('');
    setUiState('live');
  };

  // Quick filter by operation type from KPI cards
  const handleFilterOperation = (type: string) => {
    setSelectedType(type);
  };

  // Handle New Operation / Delivery submission
  const handleCreateDelivery = async (input: CreateDeliveryInput) => {
    await deliveryService.createDelivery(input);
    await loadDashboardData();
    setIsModalOpen(false);
  };

  const handleExportReport = () => {
    const summary = [
      `StockSense Real-Time Inventory & Operations Report`,
      `Generated: ${new Date().toISOString()}`,
      `Total Products in Stock: ${dashboardData?.total_products_in_stock ?? 0}`,
      `Low Stock Items: ${dashboardData?.low_stock_count ?? 0}`,
      `Out of Stock Items: ${dashboardData?.out_of_stock_count ?? 0}`,
      `Pending Receipts: ${dashboardData?.pending_receipts_count ?? 0}`,
      `Pending Deliveries: ${dashboardData?.pending_deliveries_count ?? 0}`,
      `Scheduled Transfers: ${dashboardData?.scheduled_transfers_count ?? 0}`,
    ].join('\n');

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stocksense-dashboard-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full pb-12 gap-6">
      {/* State Inspector ribbon matching Stitch reference */}
      <StateInspector currentState={uiState} onStateChange={setUiState} />

      {/* Operational Breadcrumbs & Telemetry */}
      <Breadcrumbs currentSection="Inventory" currentPageTitle="Dashboard" />

      {/* Screen Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Overview of your real-time inventory operations, node metrics, and routing health.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => alert('Quick Scan: Point camera or handheld barcode reader at container or bin.')}
            className="h-[38px] px-3.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low shadow-sm flex items-center gap-2 font-body-md text-body-md font-medium transition-colors border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              qr_code_scanner
            </span>
            <span>Quick Scan</span>
          </button>
          <button
            type="button"
            onClick={handleExportReport}
            className="h-[38px] px-3.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low shadow-sm flex items-center gap-2 font-body-md text-body-md font-medium transition-colors border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              ios_share
            </span>
            <span>Export Report</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container shadow-sm flex items-center gap-2 font-body-md text-body-md font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Operation</span>
          </button>
        </div>
      </div>

      {/* ERROR STATE VIEW */}
      {uiState === 'error' && (
        <div className="w-full bg-error-container text-on-error-container p-6 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-error/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[28px] text-error">cloud_off</span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-error-container">
                Telemetry Gateway Unreachable
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {errorMessage ||
                  'Primary node synchronization timed out after 3000ms. Operations queue is buffered locally in offline cache.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 bg-error text-on-error font-body-sm text-body-sm font-semibold rounded-lg hover:opacity-90 shadow-sm transition-opacity"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE VIEW */}
      {uiState === 'loading' && <DashboardSkeleton />}

      {/* EMPTY STATE VIEW */}
      {uiState === 'empty' && (
        <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-xl shadow-sm text-center border border-outline-variant/20">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4">
            <span className="material-symbols-outlined text-[36px]">inventory_2</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            No Inventory Operations Found
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-2 mb-6">
            There are no scheduled receipts, outgoing dispatches, or active alerts matching your current filter
            criteria for Node 04.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg font-body-md text-body-md font-medium hover:bg-primary-container transition-colors shadow-sm"
            >
              Reset Filter Selections
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-surface-container-low text-on-surface rounded-lg font-body-md text-body-md font-medium hover:bg-surface-container transition-colors shadow-sm"
            >
              New Operation
            </button>
          </div>
        </div>
      )}

      {/* LIVE VIEW */}
      {uiState === 'live' && (
        <div className="flex flex-col gap-6">
          {/* 5-Column Responsive Bento KPI Cards */}
          <DashboardMetrics data={dashboardData} onFilterOperation={handleFilterOperation} />

          {/* High-Density Dynamic Filter Bar */}
          <DashboardFilterBar
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedWarehouseId={selectedWarehouseId}
            onWarehouseChange={setSelectedWarehouseId}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            warehouses={warehouses}
            categories={categories}
            onClearFilters={handleClearFilters}
          />

          {/* Two-Column Asymmetric Work Grid (8 / 4 desktop split) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Health Overview & Recent Operations */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <InventoryHealthOverview data={dashboardData} />
              <RecentOperationsTable
                operations={dashboardData?.recent_operations || []}
                searchTerm={searchTerm}
              />
            </div>

            {/* Right Column (4 cols): Stock Alerts & Node Telemetry */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <StockAlertsCard
                alerts={dashboardData?.low_stock_products || []}
                searchTerm={searchTerm}
              />
              <NodeTelemetryCard />
            </div>
          </div>
        </div>
      )}

      {/* New Delivery / Operation Modal */}
      <NewDeliveryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateDelivery}
      />
    </div>
  );
};
