import React from 'react';

export const TransferWorkflowBanner: React.FC = () => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg border border-outline-variant/20">
      {/* Stepper Lifecycle */}
      <div className="flex items-center gap-space-sm sm:gap-space-md overflow-x-auto py-1">
        {/* Step 1 */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-label-code text-label-code font-bold flex items-center justify-center">
            1
          </span>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-on-surface font-bold">DRAFT</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Specification</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline-variant text-[16px]">arrow_forward</span>

        {/* Step 2 */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-secondary-fixed text-secondary font-label-code text-label-code font-bold flex items-center justify-center">
            2
          </span>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-secondary font-bold">WAITING</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Allocation Check</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline-variant text-[16px]">arrow_forward</span>

        {/* Step 3 */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-tertiary-fixed text-tertiary font-label-code text-label-code font-bold flex items-center justify-center">
            3
          </span>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-tertiary font-bold">READY</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Picked & Staged</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline-variant text-[16px]">arrow_forward</span>

        {/* Step 4 */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary font-label-code text-label-code font-bold flex items-center justify-center">
            4
          </span>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-primary font-bold">DONE</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Stock Ledger Updated</span>
          </div>
        </div>
      </div>

      {/* Policy Note */}
      <div className="bg-surface-container-low rounded-lg p-space-sm flex items-start gap-space-sm max-w-xl border border-outline-variant/10">
        <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">info</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          <strong className="font-semibold text-on-surface">Inter-Facility Rule:</strong> An internal transfer relocates stock across bays and warehouses without altering total company asset quantity. All validated transfers are permanently logged into{' '}
          <span className="font-label-code text-[11px] text-primary font-semibold bg-surface-container px-1 py-0.5 rounded font-mono">
            Move History
          </span>
          .
        </p>
      </div>
    </div>
  );
};
