import React from 'react';
import { Receipt } from '../../types/receipt';
import { formatDate, getInitials } from '../../utils/formatters';

interface ReceiptCardViewProps {
  receipts: Receipt[];
  onValidate: (receipt: Receipt) => void;
  onViewDetail: (receipt: Receipt) => void;
}

export const ReceiptCardView: React.FC<ReceiptCardViewProps> = ({
  receipts,
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

  if (receipts.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-b-xl p-12 text-center text-on-surface-variant border border-outline-variant/20">
        No inbound receipts match current filter criteria.
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-container-lowest rounded-b-xl border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {receipts.map((r) => {
        const totalUnits = r.items.reduce((sum, item) => sum + item.quantity, 0);

        return (
          <div
            key={r.id}
            className="p-4 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors flex flex-col justify-between gap-3 border border-outline-variant/20 shadow-xs"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <span
                  onClick={() => onViewDetail(r)}
                  className="font-label-code text-label-code font-bold text-primary hover:underline cursor-pointer font-mono"
                >
                  {r.reference}
                </span>
                {getStatusBadge(r.status)}
              </div>

              {/* Supplier */}
              <div className="mt-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold flex items-center justify-center shrink-0">
                  {getInitials(r.supplier)}
                </span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
                  {r.supplier}
                </span>
              </div>

              {/* Destination Location */}
              <div className="mt-2 text-body-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-tertiary shrink-0">
                  warehouse
                </span>
                <span className="truncate">{r.destinationLocationName}</span>
              </div>

              {/* Scheduled Date */}
              <div className="mt-1 text-[11px] font-label-code text-on-surface-variant font-mono">
                Arrival: {formatDate(r.scheduledDate || r.createdAt)}
              </div>

              {/* Items Manifest summary */}
              <div className="mt-3 pt-2 border-t border-surface-container flex items-center gap-1.5 text-body-sm">
                <span className="material-symbols-outlined text-[16px] text-primary">inventory</span>
                <span className="font-medium text-on-surface">
                  {r.items.length} {r.items.length === 1 ? 'item line' : 'item lines'} ({totalUnits}{' '}
                  units total)
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-surface-container flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onViewDetail(r)}
                className="px-3 py-1 rounded-lg bg-surface-container text-on-surface text-body-sm font-medium hover:bg-surface-container-high transition-colors"
              >
                Details
              </button>
              {r.status !== 'Done' && (
                <button
                  type="button"
                  onClick={() => onValidate(r)}
                  className="px-3 py-1 rounded-lg bg-tertiary-container text-on-tertiary text-body-sm font-semibold hover:bg-tertiary transition-colors shadow-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">verified</span>
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
