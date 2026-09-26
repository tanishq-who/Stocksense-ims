import React from 'react';
import { DashboardResponse } from '../../types/dashboard';

interface DashboardMetricsProps {
  data: DashboardResponse | null;
  onFilterOperation?: (type: string) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ data, onFilterOperation }) => {
  const inStock = data?.total_products_in_stock ?? 0;
  const lowStock = data?.low_stock_count ?? 0;
  const outOfStock = data?.out_of_stock_count ?? 0;
  const totalAlerts = lowStock + outOfStock;
  const pendingReceipts = data?.pending_receipts_count ?? 0;
  const pendingDeliveries = data?.pending_deliveries_count ?? 0;
  const scheduledTransfers = data?.scheduled_transfers_count ?? 0;
  const totalProducts = data?.total_products ?? (inStock + outOfStock);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* KPI 1: Total Products in Stock */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/20">
        <div className="flex items-center justify-between gap-2">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Total Products in Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">package_2</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            {inStock.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-tertiary-fixed text-tertiary">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>
              {totalProducts > 0 ? `${Math.round((inStock / totalProducts) * 100)}%` : '100%'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">of catalog active</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Low / Out of Stock */}
      <div
        className="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/20"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Low / Out of Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            {totalAlerts.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-error-container text-on-error-container">
              {outOfStock} critical
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {lowStock} low reorder
            </span>
          </div>
        </div>
      </div>

      {/* KPI 3: Pending Receipts */}
      <div
        onClick={() => onFilterOperation && onFilterOperation('receipt')}
        className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/20 ${
          onFilterOperation ? 'cursor-pointer hover:border-secondary' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Pending Receipts
          </span>
          <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">call_received</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            {pendingReceipts.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="font-medium text-secondary">Inbound intake</span> scheduled
          </div>
        </div>
      </div>

      {/* KPI 4: Pending Deliveries */}
      <div
        onClick={() => onFilterOperation && onFilterOperation('delivery')}
        className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/20 ${
          onFilterOperation ? 'cursor-pointer hover:border-tertiary' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Pending Deliveries
          </span>
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            {pendingDeliveries.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="font-medium text-tertiary">Awaiting staging</span> & pick
          </div>
        </div>
      </div>

      {/* KPI 5: Internal Transfers */}
      <div
        onClick={() => onFilterOperation && onFilterOperation('transfer')}
        className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/20 ${
          onFilterOperation ? 'cursor-pointer hover:border-primary' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Internal Transfers
          </span>
          <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            {scheduledTransfers.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="font-medium text-primary">Inter-facility</span> routes
          </div>
        </div>
      </div>
    </div>
  );
};
