import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';
import { StateInspector, UiState } from '../components/common/StateInspector';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { ReceiptMetrics } from '../components/receipts/ReceiptMetrics';
import { ReceiptFilterBar } from '../components/receipts/ReceiptFilterBar';
import { ReceiptTable } from '../components/receipts/ReceiptTable';
import { ReceiptCardView } from '../components/receipts/ReceiptCardView';
import { NewReceiptModal } from '../components/receipts/NewReceiptModal';
import { ReceiptDetailModal } from '../components/receipts/ReceiptDetailModal';
import { receiptService } from '../api/receiptService';
import { Receipt, CreateReceiptInput } from '../types/receipt';
import { BackendLocation, BackendProduct } from '../types/delivery';

export const ReceiptsPage: React.FC = () => {
  const [uiState, setUiState] = useState<UiState>('live');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Modals
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false);
  const [selectedDetailReceipt, setSelectedDetailReceipt] = useState<Receipt | null>(null);

  // Data
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);
  const [locations, setLocations] = useState<BackendLocation[]>([]);
  const [products, setProducts] = useState<BackendProduct[]>([]);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(undefined);

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

  // Load lookup data (locations, products)
  const loadLookups = useCallback(async () => {
    try {
      const [locs, prods] = await Promise.all([
        receiptService.getLocations(),
        receiptService.getProducts(),
      ]);
      setLocations(locs);
      setProducts(prods);
    } catch (err: unknown) {
      console.warn('Failed to load lookup data:', err);
    }
  }, []);

  // Fetch Receipts from FastAPI backend
  const loadReceipts = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await receiptService.getReceipts();
      setAllReceipts(data);
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
    loadReceipts();
  }, [loadLookups, loadReceipts]);

  // Client-side filtered list based on active filters
  const filteredReceipts = useMemo(() => {
    return allReceipts.filter((receipt) => {
      // 1. Status filter
      if (selectedStatus !== 'all') {
        if (receipt.status.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // 2. Location filter
      if (selectedLocationId !== undefined) {
        if (receipt.destinationLocationId !== selectedLocationId) {
          return false;
        }
      }

      // 3. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRef = receipt.reference.toLowerCase().includes(query);
        const matchesSupplier = receipt.supplier.toLowerCase().includes(query);
        const matchesBay = receipt.destinationLocationName.toLowerCase().includes(query);
        const matchesProduct = receipt.items.some(
          (item) =>
            item.productName.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query)
        );
        if (!matchesRef && !matchesSupplier && !matchesBay && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [allReceipts, selectedStatus, selectedLocationId, searchTerm]);

  // Handle New Receipt creation
  const handleCreateReceipt = async (input: CreateReceiptInput) => {
    try {
      const created = await receiptService.createReceipt(input);
      await loadReceipts();
      setToastMessage({
        type: 'success',
        text: `Receipt ${created.reference} created successfully${
          input.validateImmediately ? ' and posted to stock inventory!' : ' as Draft.'
        }`,
      });
      setUiState('live');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create receipt.';
      setToastMessage({
        type: 'error',
        text: msg,
      });
      throw err;
    }
  };

  // Handle Receipt Validation
  const handleValidateReceipt = async (receipt: Receipt) => {
    try {
      const updated = await receiptService.validateReceipt(receipt.id);
      await loadReceipts();
      setToastMessage({
        type: 'success',
        text: `Receipt ${updated.reference} validated! Stock quantity successfully incremented at ${updated.destinationLocationName}.`,
      });
      if (selectedDetailReceipt && selectedDetailReceipt.id === receipt.id) {
        setSelectedDetailReceipt(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to validate receipt.';
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
    setSelectedLocationId(undefined);
    setUiState('live');
  };

  // Retry loading
  const handleRetry = () => {
    setUiState('loading');
    setTimeout(() => {
      loadReceipts();
    }, 350);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredReceipts.length === 0) {
      setToastMessage({ type: 'info', text: 'No receipt records to export.' });
      return;
    }
    const headers = ['Reference', 'Supplier', 'Destination Bay', 'Status', 'Date', 'Total Units', 'Products'];
    const rows = filteredReceipts.map((r) => [
      r.reference,
      `"${r.supplier.replace(/"/g, '""')}"`,
      `"${r.destinationLocationName.replace(/"/g, '""')}"`,
      r.status,
      r.scheduledDate || r.createdAt,
      r.items.reduce((acc, i) => acc + i.quantity, 0),
      `"${r.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join('; ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSense_Inbound_Receipts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({ type: 'success', text: `Exported ${filteredReceipts.length} receipts to CSV.` });
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* State Inspector ribbon */}
      <StateInspector currentState={uiState} onStateChange={setUiState} />

      {/* Operational Breadcrumbs */}
      <Breadcrumbs currentSection="Operations" currentPageTitle="Receipts" />

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
        <div className="flex items-center gap-space-sm">
          <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[26px]">move_to_inbox</span>
          </span>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
              Receipts
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage incoming stock, bay allotments, vendor PO intake, and inventory posting.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            type="button"
            onClick={() => {
              setToastMessage({
                type: 'info',
                text: 'Barcode optical scanner initialized. Ready for ASN/PO barcodes.',
              });
            }}
            className="flex items-center gap-2 px-space-md py-2 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium shadow-sm hover:bg-surface-container transition-colors border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              qr_code_scanner
            </span>
            <span>Quick Receive / Scan</span>
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
            onClick={() => setIsNewReceiptOpen(true)}
            className="flex items-center gap-2 px-space-lg py-2 rounded-xl bg-primary-container text-on-primary font-body-md text-body-md font-semibold shadow-md hover:bg-primary transition-all shadow-primary-container/20 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>+ New Receipt</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Bento Cluster */}
      <ReceiptMetrics
        receipts={allReceipts}
        selectedStatus={selectedStatus}
        onStatusClick={(status) => {
          setSelectedStatus(status.toLowerCase());
        }}
      />

      {/* Filter and Search Actions Bar */}
      <ReceiptFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedLocationId={selectedLocationId}
        onLocationChange={setSelectedLocationId}
        locations={locations}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadReceipts}
        onClearFilters={handleClearFilters}
      />

      {/* Main Content Area based on uiState */}
      {uiState === 'loading' && <LoadingState />}

      {uiState === 'error' && (
        <ErrorState
          title="Backend Connection Issue"
          message={
            errorMessage ||
            'Failed to load inbound receipt operations from FastAPI backend service at http://127.0.0.1:8000.'
          }
          onRetry={handleRetry}
          onDiagnostics={() =>
            alert(
              `Diagnostics:\nEndpoint: GET /operations?operation_type=receipt\nServer: FastAPI (SQLite)\nError: ${
                errorMessage || 'None'
              }`
            )
          }
        />
      )}

      {uiState === 'empty' && (
        <EmptyState
          title="No Inbound Receipts"
          description="There are currently no inbound receipts or purchase order intakes registered in the warehouse."
          onClearFilters={handleClearFilters}
          onCreateNew={() => setIsNewReceiptOpen(true)}
        />
      )}

      {uiState === 'live' && (
        <>
          {filteredReceipts.length === 0 ? (
            <EmptyState
              title="No matching receipts"
              description="No inbound receipt records match your active search and filter parameters."
              onClearFilters={handleClearFilters}
              onCreateNew={() => setIsNewReceiptOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {viewMode === 'table' ? (
                <ReceiptTable
                  receipts={filteredReceipts}
                  onValidate={handleValidateReceipt}
                  onViewDetail={(r) => setSelectedDetailReceipt(r)}
                />
              ) : (
                <ReceiptCardView
                  receipts={filteredReceipts}
                  onValidate={handleValidateReceipt}
                  onViewDetail={(r) => setSelectedDetailReceipt(r)}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* New Receipt Modal / Intake Drawer */}
      <NewReceiptModal
        isOpen={isNewReceiptOpen}
        onClose={() => setIsNewReceiptOpen(false)}
        onSubmit={handleCreateReceipt}
        locations={locations}
        products={products}
      />

      {/* Receipt Detail Modal */}
      <ReceiptDetailModal
        receipt={selectedDetailReceipt}
        onClose={() => setSelectedDetailReceipt(null)}
        onValidate={handleValidateReceipt}
      />
    </div>
  );
};
