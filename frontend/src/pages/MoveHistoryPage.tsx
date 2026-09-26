import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';
import { StateInspector, UiState } from '../components/common/StateInspector';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { MoveHistoryWorkflowBanner } from '../components/moveHistory/MoveHistoryWorkflowBanner';
import { MoveHistoryMetrics } from '../components/moveHistory/MoveHistoryMetrics';
import { MoveHistoryFilterBar } from '../components/moveHistory/MoveHistoryFilterBar';
import { MoveHistoryTable } from '../components/moveHistory/MoveHistoryTable';
import { MoveHistoryCardView } from '../components/moveHistory/MoveHistoryCardView';
import { MoveDetailModal } from '../components/moveHistory/MoveDetailModal';
import { moveHistoryService, BackendWarehouse } from '../api/moveHistoryService';
import { MoveHistoryItem } from '../types/moveHistory';
import { BackendLocation, BackendProduct } from '../types/delivery';

export const MoveHistoryPage: React.FC = () => {
  const [uiState, setUiState] = useState<UiState>('live');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Modals
  const [selectedDetailItem, setSelectedDetailItem] = useState<MoveHistoryItem | null>(null);

  // Data
  const [allMovements, setAllMovements] = useState<MoveHistoryItem[]>([]);
  const [locations, setLocations] = useState<BackendLocation[]>([]);
  const [warehouses, setWarehouses] = useState<BackendWarehouse[]>([]);
  const [products, setProducts] = useState<BackendProduct[]>([]);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  // Feedback State
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

  // Load lookup data (locations, warehouses, products)
  const loadLookups = useCallback(async () => {
    try {
      const [locs, whs, prods] = await Promise.all([
        moveHistoryService.getLocations(),
        moveHistoryService.getWarehouses(),
        moveHistoryService.getProducts(),
      ]);
      setLocations(locs);
      setWarehouses(whs);
      setProducts(prods);
    } catch (err: unknown) {
      console.warn('Failed to load lookup data:', err);
    }
  }, []);

  // Fetch Move History / Stock Ledger from FastAPI backend
  const loadMoveHistory = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await moveHistoryService.getMoveHistory();
      setAllMovements(data);
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
    loadMoveHistory();
  }, [loadLookups, loadMoveHistory]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      selectedType !== 'all' ||
      selectedLocationId !== undefined ||
      selectedDateRange !== 'all'
    );
  }, [searchTerm, selectedType, selectedLocationId, selectedDateRange]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedLocationId(undefined);
    setSelectedDateRange('all');
  };

  // Filtered list based on active filters
  const filteredMovements = useMemo(() => {
    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return allMovements.filter((item) => {
      // 1. Movement Type filter
      if (selectedType !== 'all') {
        if (item.movementType.toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }
      }

      // 2. Location filter
      if (selectedLocationId !== undefined) {
        if (item.locationId !== selectedLocationId) {
          return false;
        }
      }

      // 3. Date Range filter
      if (selectedDateRange !== 'all') {
        const itemTime = new Date(item.timestamp).getTime();
        const diffMs = now - itemTime;

        if (selectedDateRange === 'today') {
          if (diffMs > oneDayMs) return false;
        } else if (selectedDateRange === '7days') {
          if (diffMs > 7 * oneDayMs) return false;
        } else if (selectedDateRange === '30days') {
          if (diffMs > 30 * oneDayMs) return false;
        }
      }

      // 4. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesRef = item.reference.toLowerCase().includes(q);
        const matchesProduct = item.productName.toLowerCase().includes(q);
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesFrom = item.fromLocation.toLowerCase().includes(q);
        const matchesTo = item.toLocation.toLowerCase().includes(q);
        const matchesReason = item.reason ? item.reason.toLowerCase().includes(q) : false;

        if (
          !matchesRef &&
          !matchesProduct &&
          !matchesSku &&
          !matchesFrom &&
          !matchesTo &&
          !matchesReason
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allMovements, selectedType, selectedLocationId, selectedDateRange, searchTerm]);

  return (
    <div className="max-w-[1600px] mx-auto px-margin py-space-md">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-body-md animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-primary-fixed text-on-primary-fixed border-outline-variant/30'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toastMessage.type === 'success'
              ? 'check_circle'
              : toastMessage.type === 'error'
              ? 'error'
              : 'info'}
          </span>
          <span className="font-medium">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Breadcrumbs Navigation */}
      <Breadcrumbs currentSection="Audit" currentPageTitle="Move History" />

      {/* Workflow Explanatory Banner */}
      <MoveHistoryWorkflowBanner />

      {/* Metrics Row */}
      <MoveHistoryMetrics
        items={allMovements}
        selectedType={selectedType}
        onTypeClick={(type) => setSelectedType(type)}
      />

      {/* Filter Bar */}
      <MoveHistoryFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedLocationId={selectedLocationId}
        onLocationChange={setSelectedLocationId}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={setSelectedDateRange}
        locations={locations}
        warehouses={warehouses}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalFilteredCount={filteredMovements.length}
      />

      {/* Main Content Area based on UI State */}
      {uiState === 'loading' ? (
        <LoadingState />
      ) : uiState === 'error' ? (
        <ErrorState
          title="Stock Ledger Sync Failure"
          message={errorMessage || 'Unable to retrieve immutable movement audit trail from FastAPI.'}
          onRetry={loadMoveHistory}
        />
      ) : uiState === 'empty' || allMovements.length === 0 ? (
        <EmptyState
          title="No stock movements recorded"
          description="The immutable stock ledger is currently empty. Complete receipts, deliveries, internal transfers, or inventory adjustments to generate movements."
        />
      ) : filteredMovements.length === 0 ? (
        <EmptyState
          title="No matching movements"
          description="No stock ledger entries match your active query or selected filters."
          onClearFilters={handleResetFilters}
        />
      ) : viewMode === 'table' ? (
        <MoveHistoryTable
          items={filteredMovements}
          onSelectItem={(item) => setSelectedDetailItem(item)}
        />
      ) : (
        <MoveHistoryCardView
          items={filteredMovements}
          onSelectItem={(item) => setSelectedDetailItem(item)}
        />
      )}

      {/* Detail Inspection Modal */}
      <MoveDetailModal
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        item={selectedDetailItem}
      />

      {/* Dev State Inspector for UI states testing */}
      <StateInspector currentState={uiState} onStateChange={setUiState} />
    </div>
  );
};
