import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';
import { StateInspector, UiState } from '../components/common/StateInspector';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { TransferWorkflowBanner } from '../components/transfers/TransferWorkflowBanner';
import { TransferMetrics } from '../components/transfers/TransferMetrics';
import { TransferFilterBar } from '../components/transfers/TransferFilterBar';
import { TransferTable } from '../components/transfers/TransferTable';
import { TransferCardView } from '../components/transfers/TransferCardView';
import { NewTransferModal } from '../components/transfers/NewTransferModal';
import { TransferDetailModal } from '../components/transfers/TransferDetailModal';
import { transferService, LocationStock } from '../api/transferService';
import { API_BASE_URL } from '../api/client';
import { Transfer, CreateTransferInput } from '../types/transfer';
import { BackendLocation, BackendProduct } from '../types/delivery';

export const TransfersPage: React.FC = () => {
  const [uiState, setUiState] = useState<UiState>('live');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Modals
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [selectedDetailTransfer, setSelectedDetailTransfer] = useState<Transfer | null>(null);

  // Data
  const [allTransfers, setAllTransfers] = useState<Transfer[]>([]);
  const [locations, setLocations] = useState<BackendLocation[]>([]);
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [stockLevels, setStockLevels] = useState<LocationStock[]>([]);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<number | undefined>(undefined);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | undefined>(undefined);

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

  // Load lookup data (locations, products, stock levels)
  const loadLookups = useCallback(async () => {
    try {
      const [locs, prods, stocks] = await Promise.all([
        transferService.getLocations(),
        transferService.getProducts(),
        transferService.getStockLevels(),
      ]);
      setLocations(locs);
      setProducts(prods);
      setStockLevels(stocks);
    } catch (err: unknown) {
      console.warn('Failed to load lookup data:', err);
    }
  }, []);

  // Fetch Transfers from FastAPI backend
  const loadTransfers = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await transferService.getTransfers();
      setAllTransfers(data);
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
    loadTransfers();
  }, [loadLookups, loadTransfers]);

  // Filtered transfers based on active filters
  const filteredTransfers = useMemo(() => {
    return allTransfers.filter((transfer) => {
      // 1. Status filter
      if (selectedStatus !== 'all') {
        if (transfer.status.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // 2. Source location filter
      if (selectedSourceId !== undefined) {
        if (transfer.sourceLocationId !== selectedSourceId) {
          return false;
        }
      }

      // 3. Destination location filter
      if (selectedDestinationId !== undefined) {
        if (transfer.destinationLocationId !== selectedDestinationId) {
          return false;
        }
      }

      // 4. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRef = transfer.reference.toLowerCase().includes(query);
        const matchesSrc = transfer.sourceLocationName.toLowerCase().includes(query);
        const matchesDest = transfer.destinationLocationName.toLowerCase().includes(query);
        const matchesProduct = transfer.items.some(
          (item) =>
            item.productName.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query)
        );
        if (!matchesRef && !matchesSrc && !matchesDest && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [allTransfers, selectedStatus, selectedSourceId, selectedDestinationId, searchTerm]);

  // Handle New Transfer creation
  const handleCreateTransfer = async (input: CreateTransferInput) => {
    try {
      const created = await transferService.createTransfer(input);
      await Promise.all([loadTransfers(), loadLookups()]);
      setToastMessage({
        type: 'success',
        text: `Transfer ${created.reference} created successfully${
          input.validateImmediately ? ' and posted to stock inventory!' : ' as Draft.'
        }`,
      });
      setUiState('live');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create transfer.';
      setToastMessage({
        type: 'error',
        text: msg,
      });
      throw err;
    }
  };

  // Handle Transfer Validation
  const handleValidateTransfer = async (transfer: Transfer) => {
    try {
      const updated = await transferService.validateTransfer(transfer.id);
      await Promise.all([loadTransfers(), loadLookups()]);
      setToastMessage({
        type: 'success',
        text: `Transfer ${updated.reference} validated! Stock successfully relocated from ${updated.sourceLocationName} to ${updated.destinationLocationName}.`,
      });
      if (selectedDetailTransfer && selectedDetailTransfer.id === transfer.id) {
        setSelectedDetailTransfer(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to validate transfer.';
      setToastMessage({
        type: 'error',
        text: msg,
      });
      throw err;
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedSourceId(undefined);
    setSelectedDestinationId(undefined);
    setUiState('live');
  };

  // Retry loading
  const handleRetry = () => {
    setUiState('loading');
    setTimeout(() => {
      loadTransfers();
      loadLookups();
    }, 350);
  };

  // Export Movement Manifest CSV
  const handleExportCSV = () => {
    if (filteredTransfers.length === 0) {
      setToastMessage({ type: 'info', text: 'No transfer records to export.' });
      return;
    }
    const headers = [
      'Reference',
      'Origin (Source)',
      'Destination',
      'Status',
      'Scheduled Date',
      'Total Units',
      'Line Items',
    ];
    const rows = filteredTransfers.map((t) => [
      t.reference,
      `"${t.sourceLocationName.replace(/"/g, '""')}"`,
      `"${t.destinationLocationName.replace(/"/g, '""')}"`,
      t.status,
      t.scheduledDate || t.createdAt,
      t.items.reduce((acc, i) => acc + i.quantity, 0),
      `"${t.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join('; ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `StockSense_Internal_Transfers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({
      type: 'success',
      text: `Exported ${filteredTransfers.length} internal transfers to CSV.`,
    });
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* State Inspector ribbon */}
      <StateInspector currentState={uiState} onStateChange={setUiState} />

      {/* Operational Breadcrumbs */}
      <Breadcrumbs currentSection="Operations" currentPageTitle="Internal Transfers" />

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
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <span className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-[26px]">swap_horiz</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  Internal Transfers
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-container font-label-code text-label-code font-semibold">
                  Bay-to-Bay
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Move stock between warehouses, distribution bays, and internal production zones without altering balance sheets.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            type="button"
            onClick={() => {
              setToastMessage({
                type: 'info',
                text: 'Transfer QR scanner initialized. Optical sensors linked to Node 04.',
              });
            }}
            className="flex items-center gap-2 px-space-md py-2 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium shadow-sm hover:bg-surface-container transition-colors border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              qr_code_scanner
            </span>
            <span>Scan Transfer QR</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-space-md py-2 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium shadow-sm hover:bg-surface-container transition-colors border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              file_download
            </span>
            <span>Export Manifest</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewTransferOpen(true)}
            className="flex items-center gap-2 px-space-lg py-2 rounded-xl bg-primary-container text-on-primary font-body-md text-body-md font-semibold shadow-md hover:bg-primary transition-all shadow-primary-container/20 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>+ New Transfer</span>
          </button>
        </div>
      </div>

      {/* Stepper Workflow Banner */}
      <TransferWorkflowBanner />

      {/* KPI Metric Bento Cluster */}
      <TransferMetrics
        transfers={allTransfers}
        selectedStatus={selectedStatus}
        onStatusClick={(status) => {
          setSelectedStatus(status.toLowerCase());
        }}
      />

      {/* Filter and Search Actions Bar */}
      <TransferFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedSourceId={selectedSourceId}
        onSourceChange={setSelectedSourceId}
        selectedDestinationId={selectedDestinationId}
        onDestinationChange={setSelectedDestinationId}
        locations={locations}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => {
          loadTransfers();
          loadLookups();
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Main Content Area based on uiState */}
      {uiState === 'loading' && <LoadingState />}

      {uiState === 'error' && (
        <ErrorState
          title="Transfer Sync Telemetry Failed"
          message={
            errorMessage ||
            `Unable to pull inventory transfer changes from FastAPI backend service at ${API_BASE_URL}.`
          }
          onRetry={handleRetry}
          onDiagnostics={() =>
            alert(
              `Diagnostics:\nEndpoint: GET /operations?operation_type=transfer\nServer: FastAPI (SQLite)\nError: ${
                errorMessage || 'None'
              }`
            )
          }
        />
      )}

      {uiState === 'empty' && (
        <EmptyState
          title="No Internal Transfers Found"
          description="There are currently no internal stock movement manifests matching your current active filters. Adjust your filters or schedule a new internal relocation."
          onClearFilters={handleClearFilters}
          onCreateNew={() => setIsNewTransferOpen(true)}
        />
      )}

      {uiState === 'live' && (
        <>
          {filteredTransfers.length === 0 ? (
            <EmptyState
              title="No matching transfers"
              description="No internal transfer records match your active search and route filter parameters."
              onClearFilters={handleClearFilters}
              onCreateNew={() => setIsNewTransferOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {viewMode === 'table' ? (
                <TransferTable
                  transfers={filteredTransfers}
                  onValidate={handleValidateTransfer}
                  onViewDetail={(t) => setSelectedDetailTransfer(t)}
                />
              ) : (
                <TransferCardView
                  transfers={filteredTransfers}
                  onValidate={handleValidateTransfer}
                  onViewDetail={(t) => setSelectedDetailTransfer(t)}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* New Internal Transfer Modal Drawer */}
      <NewTransferModal
        isOpen={isNewTransferOpen}
        onClose={() => setIsNewTransferOpen(false)}
        onSubmit={handleCreateTransfer}
        locations={locations}
        products={products}
        stockLevels={stockLevels}
      />

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        transfer={selectedDetailTransfer}
        onClose={() => setSelectedDetailTransfer(null)}
        onValidate={handleValidateTransfer}
      />
    </div>
  );
};
