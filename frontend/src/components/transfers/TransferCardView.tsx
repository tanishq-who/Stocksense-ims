import React from 'react';
import { Transfer } from '../../types/transfer';
import { formatDate } from '../../utils/formatters';

interface TransferCardViewProps {
  transfers: Transfer[];
  onValidate: (transfer: Transfer) => void;
  onViewDetail: (transfer: Transfer) => void;
}

export const TransferCardView: React.FC<TransferCardViewProps> = ({
  transfers,
  onValidate,
  onViewDetail,
}) => {
  const getStatusBadge = (status: string) => {
    if (status === 'Done') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-label-caps text-label-caps uppercase tracking-wider font-semibold">
          <span className="material-symbols-outlined text-[13px]">check_circle</span> Done
        </span>
      );
    }
    if (status === 'Ready') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-caps text-label-caps uppercase tracking-wider font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Ready
        </span>
      );
    }
    if (status === 'Waiting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed/40 text-secondary font-label-caps text-label-caps uppercase tracking-wider font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Waiting
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-outline" /> Draft
      </span>
    );
  };

  if (transfers.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-b-xl p-12 text-center text-on-surface-variant border border-outline-variant/20">
        No internal transfers match current filter criteria.
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-container-lowest rounded-b-xl border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {transfers.map((t) => {
        const totalUnits = t.items.reduce((sum, item) => sum + item.quantity, 0);
        const isDone = t.status === 'Done';

        return (
          <div
            key={t.id}
            className="p-4 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors flex flex-col justify-between gap-3 border border-outline-variant/20 shadow-xs"
          >
            <div>
              {/* Card Header: Reference and Status */}
              <div className="flex items-center justify-between gap-2">
                <span
                  onClick={() => onViewDetail(t)}
                  className="font-label-code text-label-code font-bold text-primary hover:underline cursor-pointer font-mono"
                >
                  {t.reference}
                </span>
                {getStatusBadge(t.status)}
              </div>

              {/* Route Specification (Origin -> Destination) */}
              <div className="mt-3 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between gap-2">
                {/* Source */}
                <div className="flex-1 min-w-0">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block">
                    Origin
                  </span>
                  <div className="font-body-sm font-semibold text-on-surface truncate">
                    {t.sourceLocationName}
                  </div>
                </div>

                {/* Arrow */}
                <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>

                {/* Destination */}
                <div className="flex-1 min-w-0 text-right">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block">
                    Destination
                  </span>
                  <div className="font-body-sm font-semibold text-on-surface truncate">
                    {t.destinationLocationName}
                  </div>
                </div>
              </div>

              {/* Scheduled Date */}
              <div className="mt-2 text-[11px] font-label-code text-on-surface-variant font-mono">
                Dispatch: {formatDate(t.scheduledDate || t.createdAt)}
              </div>

              {/* Items Manifest summary */}
              <div className="mt-2.5 pt-2 border-t border-surface-container flex items-center gap-1.5 text-body-sm">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  inventory_2
                </span>
                <span className="font-medium text-on-surface">
                  {t.items.length} {t.items.length === 1 ? 'item' : 'items'} ({totalUnits} units)
                </span>
              </div>
              <div className="text-[11px] text-on-surface-variant truncate pl-5">
                {t.items.map((i) => i.productName).join(', ') || 'No line items'}
              </div>
            </div>

            {/* Actions footer */}
            <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onViewDetail(t)}
                className="text-body-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Manifest Details</span>
              </button>

              {!isDone && (
                <button
                  type="button"
                  onClick={() => onValidate(t)}
                  className="px-3 py-1 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant hover:bg-tertiary hover:text-on-tertiary transition-colors font-body-sm text-body-sm font-medium shadow-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Validate</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
