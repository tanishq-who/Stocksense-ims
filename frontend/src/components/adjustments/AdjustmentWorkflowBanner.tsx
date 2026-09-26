import React from 'react';

export const AdjustmentWorkflowBanner: React.FC = () => {
  return (
    <div className="bg-surface-container-low rounded-xl p-space-md lg:p-space-lg shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md mb-space-lg border border-outline-variant/20">
      {/* Steps Indicator */}
      <div className="flex items-center gap-space-sm flex-wrap font-body-sm text-body-sm">
        <div className="flex items-center gap-2 bg-surface-container-lowest px-space-md py-1.5 rounded-lg shadow-xs border border-outline-variant/15">
          <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary font-label-code text-[11px] font-bold flex items-center justify-center font-mono">
            1
          </span>
          <span className="font-semibold text-on-surface">DRAFT</span>
          <span className="text-on-surface-variant text-[11px] font-label-caps uppercase tracking-wider">
            Physical Count
          </span>
        </div>

        <span className="material-symbols-outlined text-outline-variant text-[18px]">
          arrow_forward
        </span>

        <div className="flex items-center gap-2 bg-surface-container-lowest px-space-md py-1.5 rounded-lg shadow-xs border border-outline-variant/15">
          <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-code text-[11px] font-bold flex items-center justify-center font-mono">
            2
          </span>
          <span className="font-semibold text-on-surface">WAITING</span>
          <span className="text-on-surface-variant text-[11px] font-label-caps uppercase tracking-wider">
            Review & Sign-Off
          </span>
        </div>

        <span className="material-symbols-outlined text-outline-variant text-[18px]">
          arrow_forward
        </span>

        <div className="flex items-center gap-2 bg-surface-container-lowest px-space-md py-1.5 rounded-lg shadow-xs border border-outline-variant/15">
          <span className="w-5 h-5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-code text-[11px] font-bold flex items-center justify-center font-mono">
            3
          </span>
          <span className="font-semibold text-on-surface">DONE</span>
          <span className="text-on-surface-variant text-[11px] font-label-caps uppercase tracking-wider">
            Ledger Posted & Synced
          </span>
        </div>
      </div>

      {/* Explanatory reconciliation rule */}
      <div className="flex items-start gap-space-sm max-w-2xl bg-surface-container-lowest/90 p-space-sm rounded-lg border border-outline-variant/15">
        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5 shrink-0">
          policy
        </span>
        <div className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
          <strong className="text-on-surface font-semibold">Inventory Reconciliation Rule:</strong>{' '}
          Counted &gt; Recorded = Stock Increase (<span className="text-tertiary font-bold">+</span>), Counted &lt; Recorded = Stock Variance / Decrease (<span className="text-error font-bold">-</span>), Counted = Recorded = Neutral (<span className="text-outline font-bold">0</span>). Once validated, delta adjustments write permanently to the Stock Ledger.
        </div>
      </div>
    </div>
  );
};
