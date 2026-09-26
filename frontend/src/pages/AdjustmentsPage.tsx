import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';
import { StateInspector, UiState } from '../components/common/StateInspector';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { AdjustmentWorkflowBanner } from '../components/adjustments/AdjustmentWorkflowBanner';
import { AdjustmentMetrics } from '../components/adjustments/AdjustmentMetrics';
import { AdjustmentFilterBar } from '../components/adjustments/AdjustmentFilterBar';
import { AdjustmentTable } from '../components/adjustments/AdjustmentTable';
import { AdjustmentCardView } from '../components/adjustments/AdjustmentCardView';
import { NewAdjustmentModal } from '../components/adjustments/NewAdjustmentModal';
import { AdjustmentDetailModal } from '../components/adjustments/AdjustmentDetailModal';
import { adjustmentService, LocationStockLevel } from '../api/adjustmentService';
import { API_BASE_URL } from '../api/client';
import { Adjustment, CreateAdjustmentInput } from '../types/adjustment';
import { BackendLocation, BackendProduct } from '../types/delivery';

export const AdjustmentsPage: React.FC = () => {
  const [uiState, setUiState] = useState<UiState>('live');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Modals
  const [isNewAdjustmentOpen, setIsNewAdjustmentOpen] = useState(false);
  const [selectedDetailAdjustment, setSelectedDetailAdjustment] = useState<Adjustment | null>(null);

  // Data
  const [allAdjustments, setAllAdjustments] = useState<Adjustment[]>([]);
  const [locations, setLocations] = useState<BackendLocation[]>([]);
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [stockLevels, setStockLevels] = useState<LocationStockLevel[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(undefined);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<
    'all' | 'positive' | 'negative' | 'neutral'
  >('all');

  // Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load lookup data
  const loadLookups = useCallback(async () => {
    try {
      const [locs, prods, stocks] = await Promise.all([
        adjustmentService.getLocations(),
        adjustmentService.getProducts(),
        adjustmentService.getStockLevels(),
      ]);
      setLocations(locs);
      setProducts(prods);
      setStockLevels(stocks);
    } catch (err: unknown) {
      console.warn('Failed to load lookup data:', err);
    }
  }, []);

  // Fetch Adjustments from FastAPI backend
  const loadAdjustments = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await adjustmentService.getAdjustments();
      setAllAdjustments(data);
      setUiState((prev) => (prev === 'loading' || prev === 'error' ? 'live' : prev));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to FastAPI backend.';
      setErrorMessage(msg);
      setUiState('error');
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadLookups();
    loadAdjustments();
  }, [loadLookups, loadAdjustments]);

  // Filtered adjustments
  const filteredAdjustments = useMemo(() => {
    return allAdjustments.filter((adj) => {
      // 1. Status
      if (selectedStatus !== 'all') {
        if (adj.status.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // 2. Location
      if (selectedLocationId !== undefined) {
        if (adj.locationId !== selectedLocationId) {
          return false;
        }
      }

      // 3. Discrepancy
      if (selectedDiscrepancy !== 'all') {
        if (selectedDiscrepancy === 'positive') {
          if (!adj.items.some((i) => i.difference > 0)) return false;
        } else if (selectedDiscrepancy === 'negative') {
          if (!adj.items.some((i) => i.difference < 0)) return false;
        } else if (selectedDiscrepancy === 'neutral') {
          if (!adj.items.every((i) => i.difference === 0)) return false;
        }
      }

      // 4. Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRef = adj.reference.toLowerCase().includes(query);
        const matchesLoc = adj.locationName.toLowerCase().includes(query);
        const matchesReason = Boolean(adj.reason && adj.reason.toLowerCase().includes(query));
        const matchesProduct = adj.items.some(
          (item) =>
            item.productName.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        );
        if (!matchesRef && !matchesLoc && !matchesReason && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [allAdjustments, selectedStatus, selectedLocationId, selectedDiscrepancy, searchTerm]);

  // Handle New Adjustment creation
  const handleCreateAdjustment = async (input: CreateAdjustmentInput) => {
    try {
      const created = await adjustmentService.createAdjustment(input);
      await Promise.all([loadAdjustments(), loadLookups()]);
      setToastMessage({
        type: 'success',
        text: `Inventory adjustment ${created.reference} saved successfully${
          input.validateImmediately ? ' and reconciled into stock ledger!' : ' as Draft.'
        }`,
      });
      setUiState('live');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create adjustment.';
      setToastMessage({
        type: 'error',
        text: msg,
      });
      throw err;
    }
  };

  // Handle Adjustment Validation
  const handleValidateAdjustment = async (adjustment: Adjustment) => {
    try {
      const updated = await adjustmentService.validateAdjustment(adjustment.id);
      await Promise.all([loadAdjustments(), loadLookups()]);
      setToastMessage({
        type: 'success',
        text: `Adjustment ${updated.reference} validated! Physical count reconciled and posted to SQLite stock levels & ledger.`,
      });
      if (selectedDetailAdjustment && selectedDetailAdjustment.id === adjustment.id) {
        setSelectedDetailAdjustment(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to validate adjustment.';
      setToastMessage({
        type: 'error',
        text: msg,
      });
      throw err;
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedLocationId(undefined);
    setSelectedDiscrepancy('all');
    setUiState('live');
  };

  // Retry loading
  const handleRetry = () => {
    setUiState('loading');
    setTimeout(() => {
      loadAdjustments();
      loadLookups();
    }, 350);
  };

  // Export Audit Sheet CSV
  const handleExportCSV = () => {
    if (filteredAdjustments.length === 0) {
      setToastMessage({ type: 'info', text: 'No adjustment records to export.' });
      return;
    }
    const headers = [
      'Reference',
      'Location',
      'Status',
      'Reason',
      'Date',
      'Products Audited',
      'Net Variance Delta',
    ];
    const rows = filteredAdjustments.map((a) => [
      a.reference,
      `"${a.locationName.replace(/"/g, '""')}"`,
      a.status,
      `"${(a.reason || '').replace(/"/g, '""')}"`,
      a.createdAt,
      `"${a.items
        .map(
          (i) =>
            `${i.productName} (Rec: ${i.recordedStock}, Count: ${i.physicalCount}, Delta: ${i.difference})`
        )
        .join('; ')}"`,
      a.items.reduce((acc, i) => acc + i.difference, 0),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `StockSense_Audit_Sheet_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({
      type: 'success',
      text: `Exported ${filteredAdjustments.length} adjustment records to CSV.`,
    });
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* State Inspector ribbon */}
      <StateInspector currentState={uiState} onStateChange={setUiState} />

      {/* Operational Breadcrumbs */}
      <Breadcrumbs currentSection="Operations" currentPageTitle="Inventory Adjustments" />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`mb-space-md p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-tertiary-fixed/30 border-tertiary-container/40 text-on-surface'
              : toastMessage.type === 'error'
              ? 'bg-error-container/40 border-error/30 text-error'
              : 'bg-surface-container border-outline-variant/30 text-on-surface'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-[20px] ${
                toastMessage.type === 'success'
                  ? 'text-tertiary'
                  : toastMessage.type === 'error'
                  ? 'text-error'
                  : 'text-primary'
              }`}
            >
              {toastMessage.type === 'success'
                ? 'check_circle'
                : toastMessage.type === 'error'
                ? 'error'
                : 'info'}
            </span>
            <span className="font-body-md text-body-md font-medium">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface"
            aria-label="Dismiss message"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg mb-space-lg">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[26px]">rule</span>
            </span>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              Inventory Adjustments
            </h1>
            <span className="px-space-sm py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-caps text-label-caps tracking-wider font-semibold">
              Cycle Count & Audit
            </span>
            <span className="flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              ACTIVE AUDIT BATCH
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Review physical stock counts, verify reconciliations, and correct real-time warehouse inventory differences.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={() => {
              setToastMessage({
                type: 'info',
                text: 'Handheld scanner bridge active. Ready to scan item barcodes.',
              });
            }}
            className="h-9 px-space-md rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium shadow-sm hover:bg-surface-container transition-colors flex items-center gap-2 border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              qr_code_scanner
            </span>
            <span>Barcode Scanner</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-space-md rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium shadow-sm hover:bg-surface-container transition-colors flex items-center gap-2 border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              download
            </span>
            <span>Export Audit Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewAdjustmentOpen(true)}
            className="h-9 px-space-md rounded-lg bg-primary-container text-on-primary font-body-md text-body-md font-semibold shadow-sm hover:bg-primary transition-all flex items-center gap-2 shadow-primary-container/20 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ New Adjustment</span>
          </button>
        </div>
      </div>

      {/* Workflow Banner */}
      <AdjustmentWorkflowBanner />

      {/* KPI Bento Cluster */}
      <AdjustmentMetrics
        adjustments={allAdjustments}
        selectedStatus={selectedStatus}
        selectedDiscrepancy={selectedDiscrepancy}
        onStatusClick={(status) => {
          setSelectedStatus(status);
        }}
        onDiscrepancyClick={(type) => {
          setSelectedDiscrepancy(type);
        }}
      />

      {/* Filter and Search Actions Bar */}
      <AdjustmentFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedLocationId={selectedLocationId}
        onLocationChange={setSelectedLocationId}
        selectedDiscrepancy={selectedDiscrepancy}
        onDiscrepancyChange={setSelectedDiscrepancy}
        locations={locations}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => {
          loadAdjustments();
          loadLookups();
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Main Content Area based on uiState */}
      {uiState === 'loading' && <LoadingState />}

      {uiState === 'error' && (
        <ErrorState
          title="Adjustment Sync Failed"
          message={
            errorMessage ||
            `Unable to connect to the FastAPI inventory adjustment service at ${API_BASE_URL}.`
          }
          onRetry={handleRetry}
          onDiagnostics={() =>
            alert(
              `Diagnostics:\nEndpoint: GET /operations?operation_type=adjustment\nServer: FastAPI (SQLite)\nError: ${
                errorMessage || 'None'
              }`
            )
          }
        />
      )}

      {uiState === 'empty' && (
        <EmptyState
          title="No Inventory Adjustments"
          description="There are currently no cycle counts, audits, or inventory discrepancy adjustments logged."
          onClearFilters={handleClearFilters}
          onCreateNew={() => setIsNewAdjustmentOpen(true)}
        />
      )}

      {uiState === 'live' && (
        <>
          {filteredAdjustments.length === 0 ? (
            <EmptyState
              title="No matching adjustments"
              description="No inventory adjustments match your active search, location, or variance filters."
              onClearFilters={handleClearFilters}
              onCreateNew={() => setIsNewAdjustmentOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {viewMode === 'table' ? (
                <AdjustmentTable
                  adjustments={filteredAdjustments}
                  onValidate={handleValidateAdjustment}
                  onViewDetail={(a) => setSelectedDetailAdjustment(a)}
                />
              ) : (
                <AdjustmentCardView
                  adjustments={filteredAdjustments}
                  onValidate={handleValidateAdjustment}
                  onViewDetail={(a) => setSelectedDetailAdjustment(a)}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* New Adjustment Modal Drawer */}
      <NewAdjustmentModal
        isOpen={isNewAdjustmentOpen}
        onClose={() => setIsNewAdjustmentOpen(false)}
        onSubmit={handleCreateAdjustment}
        locations={locations}
        products={products}
        stockLevels={stockLevels}
      />

      {/* Adjustment Detail Modal */}
      <AdjustmentDetailModal
        adjustment={selectedDetailAdjustment}
        onClose={() => setSelectedDetailAdjustment(null)}
        onValidate={handleValidateAdjustment}
      />
    </div>
  );
};
