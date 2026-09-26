import React from 'react';
import { Receipt } from '../../types/receipt';

interface ReceiptMetricsProps {
  receipts: Receipt[];
  selectedStatus?: string;
  onStatusClick?: (status: string) => void;
}

export const ReceiptMetrics: React.FC<ReceiptMetricsProps> = ({
  receipts,
  selectedStatus,
  onStatusClick,
}) => {
  const totalCount = receipts.length;
  const waitingCount = receipts.filter((r) => r.status === 'Waiting').length;
  const readyCount = receipts.filter((r) => r.status === 'Ready').length;
  const doneCount = receipts.filter((r) => r.status === 'Done').length;
  const draftCount = receipts.filter((r) => r.status === 'Draft').length;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
      {/* 1. Total Receipts */}
      <div
        onClick={() => onStatusClick && onStatusClick('all')}
        className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus === 'all' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      >
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">
            Total Receipts
          </span>
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          </div>
        </div>
        <div className="flex items-baseline gap-space-sm mb-1">
          <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
            {totalCount.toLocaleString()}
          </span>
          {draftCount > 0 && (
            <span className="flex items-center text-on-surface-variant font-label-caps text-label-caps bg-surface-container px-1.5 py-0.5 rounded">
              {draftCount} draft
            </span>
          )}
        </div>
        <div className="font-label-code text-[11px] text-on-surface-variant flex items-center gap-1 font-mono">
          <span className="material-symbols-outlined text-[14px]">local_shipping</span>
          <span>Active in-terminal queue</span>
        </div>
      </div>

      {/* 2. Waiting */}
      <div
        onClick={() => onStatusClick && onStatusClick('Waiting')}
        className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'waiting' ? 'ring-2 ring-secondary ring-offset-1' : ''}`}
      >
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">
            Waiting
          </span>
          <div className="w-8 h-8 rounded-lg bg-secondary-fixed/40 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
        </div>
        <div className="flex items-baseline gap-space-sm mb-1">
          <span className="font-headline-xl text-headline-xl text-secondary font-bold">
            {waitingCount.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-caps text-label-caps uppercase tracking-wider font-semibold">
            In Transit
          </span>
        </div>
        <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
          Awaiting carrier dock check-in
        </div>
      </div>

      {/* 3. Ready */}
      <div
        onClick={() => onStatusClick && onStatusClick('Ready')}
        className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'ready' ? 'ring-2 ring-tertiary ring-offset-1' : ''}`}
      >
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">
            Ready
          </span>
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
          </div>
        </div>
        <div className="flex items-baseline gap-space-sm mb-1">
          <span className="font-headline-xl text-headline-xl text-tertiary font-bold">
            {readyCount.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/50 text-on-tertiary-fixed-variant font-label-caps text-label-caps uppercase tracking-wider font-semibold">
            At Bay
          </span>
        </div>
        <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
          Awaiting QA &amp; put-away confirmation
        </div>
      </div>

      {/* 4. Completed (Done) */}
      <div
        onClick={() => onStatusClick && onStatusClick('Done')}
        className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'done' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      >
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">
            Completed (Done)
          </span>
          <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">verified</span>
          </div>
        </div>
        <div className="flex items-baseline gap-space-sm mb-1">
          <span className="font-headline-xl text-headline-xl text-primary font-bold">
            {doneCount.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-primary-fixed/60 text-on-primary-fixed-variant font-label-caps text-label-caps uppercase tracking-wider font-semibold">
            Posted
          </span>
        </div>
        <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
          Posted straight to inventory registers
        </div>
      </div>
    </section>
  );
};
