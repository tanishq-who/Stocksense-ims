import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';
import { StateInspector, UiState } from '../components/common/StateInspector';
import { DeliveryMetrics } from '../components/delivery/DeliveryMetrics';
import { DeliveryFilterBar } from '../components/delivery/DeliveryFilterBar';
import { DeliveryTable } from '../components/delivery/DeliveryTable';
import { DeliveryCardView } from '../components/delivery/DeliveryCardView';
import { DeliveryPagination } from '../components/delivery/DeliveryPagination';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { NewDeliveryModal } from '../components/delivery/NewDeliveryModal';
import { deliveryService } from '../api/deliveryService';
import { Delivery, CreateDeliveryInput } from '../types/delivery';

export const DeliveryPage: React.FC = () => {
  const [uiState, setUiState] = useState<UiState>('live');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data & Filter State
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Deliveries
  const loadDeliveries = useCallback(async () => {
    try {
      const response = await deliveryService.getDeliveries({
        search: searchTerm,
        status: selectedStatus,
        warehouse: selectedWarehouse,
        page: currentPage,
        pageSize,
      });

      setDeliveries(response.items);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);

      // If user is in live mode and no items returned, we show empty state or table
    } catch {
      setUiState('error');
    }
  }, [searchTerm, selectedStatus, selectedWarehouse, currentPage, pageSize]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Handle New Delivery creation
  const handleCreateDelivery = async (input: CreateDeliveryInput) => {
    await deliveryService.createDelivery(input);
    await loadDeliveries();
    setUiState('live');
  };

  // Handlers for state switching & retrying
  const handleRetry = () => {
    setUiState('loading');
    setTimeout(() => {
      loadDeliveries();
      setUiState('live');
    }, 600);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
    setSelectedWarehouse('All');
    setCurrentPage(1);
    setUiState('live');
  };

  // Calculate live counts for Bento KPI cluster
  const readyCount = deliveries.filter((d) => d.status === 'Ready').length;
  const waitingCount = deliveries.filter((d) => d.status === 'Waiting').length;
  const draftCount = deliveries.filter((d) => d.status === 'Draft').length;

  return (
    <div className="flex flex-col w-full pb-12">
      {/* State Inspector ribbon matching Stitch reference */}
      <StateInspector currentState={uiState} onStateChange={setUiState} />

      {/* Operational Breadcrumbs & Telemetry */}
      <Breadcrumbs currentSection="Operations" currentPageTitle="Delivery" />

      {/* KPI Bento Metrics Cluster */}
      <DeliveryMetrics
        readyCount={readyCount > 0 ? readyCount : 24}
        waitingCount={waitingCount > 0 ? waitingCount : 12}
        draftCount={draftCount > 0 ? draftCount : 8}
        onNewDeliveryClick={() => setIsModalOpen(true)}
        onExportCsv={() => alert('Exporting Outbound Deliveries Manifest (CSV)...')}
        onPrintBatch={() => window.print()}
      />

      {/* Filter and Search Actions Bar */}
      <DeliveryFilterBar
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(status) => {
          setSelectedStatus(status);
          setCurrentPage(1);
        }}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={(warehouse) => {
          setSelectedWarehouse(warehouse);
          setCurrentPage(1);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewDeliveryClick={() => setIsModalOpen(true)}
      />

      {/* Main Content Area based on uiState */}
      {uiState === 'loading' && <LoadingState />}

      {uiState === 'error' && (
        <ErrorState
          onRetry={handleRetry}
          onDiagnostics={() => alert('Diagnostics: Telemetry socket NODE_04 handshake trace normal.')}
        />
      )}

      {uiState === 'empty' && (
        <EmptyState
          onClearFilters={handleClearFilters}
          onCreateNew={() => setIsModalOpen(true)}
        />
      )}

      {uiState === 'live' && (
        <>
          {deliveries.length === 0 ? (
            <EmptyState
              title="No matching deliveries"
              description="No outbound delivery records match your active search and filter parameters."
              onClearFilters={handleClearFilters}
              onCreateNew={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {viewMode === 'table' ? (
                <DeliveryTable
                  deliveries={deliveries}
                  onSelectDelivery={(d) => {
                    console.log('Selected delivery:', d);
                  }}
                />
              ) : (
                <DeliveryCardView
                  deliveries={deliveries}
                  onSelectDelivery={(d) => {
                    console.log('Selected delivery:', d);
                  }}
                />
              )}

              {/* Pagination */}
              <DeliveryPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </>
      )}

      {/* New Delivery Modal Dialog */}
      <NewDeliveryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateDelivery}
      />
    </div>
  );
};
