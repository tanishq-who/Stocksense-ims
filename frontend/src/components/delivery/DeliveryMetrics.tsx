import React from 'react';

interface DeliveryMetricsProps {
  readyCount?: number;
  waitingCount?: number;
  draftCount?: number;
  onNewDeliveryClick?: () => void;
  onExportCsv?: () => void;
  onPrintBatch?: () => void;
}

export const DeliveryMetrics: React.FC<DeliveryMetricsProps> = ({
  readyCount = 24,
  waitingCount = 12,
  onNewDeliveryClick,
  onExportCsv,
  onPrintBatch,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-xl items-stretch">
      {/* Title & Quick Actions Group */}
      <div className="xl:col-span-6 flex flex-col justify-between bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-outline-variant/30">
        <div>
          <div className="inline-flex items-center gap-1 text-primary font-label-caps text-label-caps uppercase tracking-wider mb-1 font-semibold">
            <span className="material-symbols-outlined text-[15px]">local_shipping</span>
            Outbound Fulfilment
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
            Delivery Operations
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage outgoing stock and customer deliveries. Orchestrate outward freight, dispatch runs, customer drops, and transfer manifests in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-md mt-space-lg pt-space-md bg-surface-container-low p-space-md rounded-lg">
          <button
            type="button"
            onClick={onNewDeliveryClick}
            className="inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary px-space-lg py-2 rounded-lg font-headline-sm text-headline-sm hover:opacity-95 shadow-sm transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Delivery</span>
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center justify-center gap-space-xs bg-surface-container-lowest text-on-surface px-space-md py-2 rounded-lg font-body-md text-body-md hover:bg-surface-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onPrintBatch}
            className="inline-flex items-center justify-center gap-space-xs bg-surface-container-lowest text-on-surface px-space-md py-2 rounded-lg font-body-md text-body-md hover:bg-surface-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">print</span>
            <span>Manifest Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Card: Ready to Ship */}
      <div className="xl:col-span-3 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-tertiary-fixed/20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-semibold">
              Ready to Ship
            </span>
            <div className="flex items-baseline gap-space-sm mt-1">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface tabular-nums">
                {readyCount}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">orders queued</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/30 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
          </div>
        </div>

        <div className="mt-space-lg flex items-center justify-between">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-caps text-label-caps font-semibold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            +12% vs yesterday
          </div>
          {/* Sparkline SVG */}
          <svg className="w-20 h-6 text-tertiary" fill="none" viewBox="0 0 80 24">
            <path
              d="M2 18 L18 14 L34 16 L50 8 L66 11 L78 3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* KPI Metric Card: Waiting Stock */}
      <div className="xl:col-span-3 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-secondary-container/20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-semibold">
              Waiting Stock
            </span>
            <div className="flex items-baseline gap-space-sm mt-1">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface tabular-nums">
                {waitingCount}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">awaiting pick</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container-high text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">pending_actions</span>
          </div>
        </div>

        <div className="mt-space-lg flex items-center justify-between">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-caps text-label-caps font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            3 critical backorders
          </div>
          {/* Micro Bar indicator */}
          <div className="flex items-end gap-1 h-6">
            <span className="w-1.5 h-3 bg-secondary/40 rounded-sm" />
            <span className="w-1.5 h-4 bg-secondary/60 rounded-sm" />
            <span className="w-1.5 h-2 bg-secondary/40 rounded-sm" />
            <span className="w-1.5 h-6 bg-error rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
