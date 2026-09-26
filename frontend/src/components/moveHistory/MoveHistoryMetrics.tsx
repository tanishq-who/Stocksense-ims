import React from 'react';
import { MoveHistoryItem } from '../../types/moveHistory';

interface MoveHistoryMetricsProps {
  items: MoveHistoryItem[];
  selectedType?: string;
  onTypeClick?: (type: string) => void;
}

export const MoveHistoryMetrics: React.FC<MoveHistoryMetricsProps> = ({
  items,
  selectedType = 'all',
  onTypeClick,
}) => {
  const totalMoves = items.length;
  const receipts = items.filter((m) => m.movementType === 'receipt');
  const deliveries = items.filter((m) => m.movementType === 'delivery');
  const transfers = items.filter((m) => m.movementType === 'transfer');
  const adjustments = items.filter((m) => m.movementType === 'adjustment');

  const totalAdded = items
    .filter((m) => m.delta > 0)
    .reduce((sum, m) => sum + m.delta, 0);

  const totalRemoved = items
    .filter((m) => m.delta < 0)
    .reduce((sum, m) => sum + Math.abs(m.delta), 0);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
      {/* 1. Total Movements */}
      <div
        onClick={() => onTypeClick?.('all')}
        className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onTypeClick ? 'cursor-pointer' : ''
        } ${selectedType === 'all' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-semibold">
              Total Move Events
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                {totalMoves}
              </span>
              <span className="font-label-code text-label-code text-outline font-mono">
                ledger lines
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          </div>
        </div>
        <div className="mt-3 pt-2 bg-surface-container-low/40 rounded px-2 py-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
          <span>Verified SQLite transaction history</span>
        </div>
      </div>

      {/* 2. Receipts (Stock Inflow) */}
      <div
        onClick={() => onTypeClick?.('receipt')}
        className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onTypeClick ? 'cursor-pointer' : ''
        } ${selectedType === 'receipt' ? 'ring-2 ring-emerald-600 ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                Receipts / Inbound
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-caps text-[10px] font-bold">
                +{totalAdded.toFixed(0)} UNITS
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-xl text-headline-xl text-emerald-700 font-bold">
                {receipts.length}
              </span>
              <span className="font-label-code text-label-code text-outline font-mono">
                moves recorded
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-[22px]">call_received</span>
          </div>
        </div>
        <div className="mt-3 pt-2 bg-surface-container-low/40 rounded px-2 py-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-emerald-600">add_circle</span>
          <span>Vendor & supplier stock intakes</span>
        </div>
      </div>

      {/* 3. Deliveries (Stock Outflow) */}
      <div
        onClick={() => onTypeClick?.('delivery')}
        className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onTypeClick ? 'cursor-pointer' : ''
        } ${selectedType === 'delivery' ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                Deliveries / Outbound
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-label-caps text-[10px] font-bold">
                -{totalRemoved.toFixed(0)} UNITS
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-xl text-headline-xl text-indigo-700 font-bold">
                {deliveries.length}
              </span>
              <span className="font-label-code text-label-code text-outline font-mono">
                dispatches
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
          </div>
        </div>
        <div className="mt-3 pt-2 bg-surface-container-low/40 rounded px-2 py-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-indigo-600">outbox</span>
          <span>Customer fulfillments and dispatches</span>
        </div>
      </div>

      {/* 4. Transfers & Adjustments */}
      <div
        onClick={() => onTypeClick?.(transfers.length > 0 ? 'transfer' : 'adjustment')}
        className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border border-outline-variant/20 ${
          onTypeClick ? 'cursor-pointer' : ''
        } ${selectedType === 'transfer' || selectedType === 'adjustment' ? 'ring-2 ring-secondary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-semibold">
              Transfers & Audits
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-xl text-headline-xl text-secondary font-bold">
                {transfers.length + adjustments.length}
              </span>
              <span className="font-label-code text-label-code text-outline font-mono">
                {transfers.length} trf / {adjustments.length} adj
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[22px]">sync_alt</span>
          </div>
        </div>
        <div className="mt-3 pt-2 bg-surface-container-low/40 rounded px-2 py-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-secondary">tune</span>
          <span>Internal bay transfers & physical audits</span>
        </div>
      </div>
    </section>
  );
};
