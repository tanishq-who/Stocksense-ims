import React from 'react';

export const MoveHistoryWorkflowBanner: React.FC = () => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 mb-space-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[22px]">history_edu</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Stock Ledger & Move History
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-container font-label-caps text-[10px] font-bold uppercase tracking-wider">
              Immutable Audit Trail
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Real-time, write-only ledger powered by SQLite transactions. Automatically records every inventory movement across Receipts, Deliveries, Transfers, and Adjustments.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-outline-variant/20">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-body-sm text-on-surface font-mono text-[11px] border border-outline-variant/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>LEDGER STATUS: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
