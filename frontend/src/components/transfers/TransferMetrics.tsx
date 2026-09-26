import React from 'react';
import { Transfer } from '../../types/transfer';

interface TransferMetricsProps {
  transfers: Transfer[];
  selectedStatus?: string;
  onStatusClick?: (status: string) => void;
}

export const TransferMetrics: React.FC<TransferMetricsProps> = ({
  transfers,
  selectedStatus,
  onStatusClick,
}) => {
  const totalCount = transfers.length;
  const draftCount = transfers.filter((t) => t.status === 'Draft').length;
  const waitingCount = transfers.filter((t) => t.status === 'Waiting').length;
  const readyCount = transfers.filter((t) => t.status === 'Ready').length;
  const doneCount = transfers.filter((t) => t.status === 'Done').length;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
      {/* 1. Total Transfers */}
      <div
        onClick={() => onStatusClick && onStatusClick('all')}
        className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus === 'all' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-semibold">
              Total Transfers
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                {totalCount}
              </span>
              {draftCount > 0 && (
                <span className="font-label-code text-label-code text-secondary font-semibold font-mono">
                  {draftCount} draft
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
          </div>
        </div>
        <div className="mt-3 pt-2 bg-surface-container-low/40 rounded px-2 py-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-secondary">sync_alt</span>
          <span>Active inter-facility staging queue</span>
        </div>
      </div>

      {/* 2. Scheduled / Waiting */}
      <div
        onClick={() => onStatusClick && onStatusClick('Waiting')}
        className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'waiting' ? 'ring-2 ring-secondary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                Waiting
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-container font-label-caps text-[10px] font-bold">
                IN TRANSIT
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-xl text-headline-xl text-secondary font-bold">
                {waitingCount}
              </span>
              <span className="font-label-code text-label-code text-outline font-mono">lots queued</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">schedule</span>
          </div>
        </div>
        <div className="mt-3 pt-2 bg-surface-container-low/40 rounded px-2 py-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-primary">forklift</span>
          <span>Awaiting bay release & dispatch</span>
        </div>
      </div>

      {/* 3. Ready */}
      <div
        onClick={() => onStatusClick && onStatusClick('Ready')}
        className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'ready' ? 'ring-2 ring-tertiary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                Ready
              </span>
              <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-caps text-[10px] font-bold">
                STAGED
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-xl text-headline-xl text-tertiary font-bold">
                {readyCount}
              </span>
              <span className="font-label-code text-label-code text-tertiary font-semibold font-mono">100% picked</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[22px]">package_2</span>
          </div>
        </div>
        <div className="mt-3 pt-2 bg-surface-container-low/40 rounded px-2 py-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-tertiary">task_alt</span>
          <span>Picked & verified at staging lane</span>
        </div>
      </div>

      {/* 4. Completed (Done) */}
      <div
        onClick={() => onStatusClick && onStatusClick('Done')}
        className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'done' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                Completed
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-caps text-[10px] font-bold">
                POSTED
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                {doneCount}
              </span>
              <span className="font-label-code text-label-code text-outline font-mono">in ledger</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
        </div>
        <div className="mt-3 pt-2 bg-surface-container-low/40 rounded px-2 py-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-primary">history</span>
          <span>Auto-logged into Move History</span>
        </div>
      </div>
    </section>
  );
};
