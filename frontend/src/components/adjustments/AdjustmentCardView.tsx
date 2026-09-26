import React from 'react';
import { Adjustment } from '../../types/adjustment';
import { formatDate } from '../../utils/formatters';

interface AdjustmentCardViewProps {
  adjustments: Adjustment[];
  onValidate: (adjustment: Adjustment) => void;
  onViewDetail: (adjustment: Adjustment) => void;
}

export const AdjustmentCardView: React.FC<AdjustmentCardViewProps> = ({
  adjustments,
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
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-outline" /> Draft
      </span>
    );
  };

  const getDifferenceBadge = (diff: number) => {
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-label-code text-label-code font-bold bg-tertiary-fixed text-on-tertiary-fixed-variant font-mono">
          <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
          +{diff}
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-label-code text-label-code font-bold bg-error-container text-on-error-container font-mono">
          <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
          {diff}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-label-code text-label-code font-medium bg-surface-container text-on-surface-variant font-mono">
        <span className="material-symbols-outlined text-[13px]">check</span>
        0
      </span>
    );
  };

  if (adjustments.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-b-xl p-12 text-center text-on-surface-variant border border-outline-variant/20">
        No inventory adjustment records match current filter criteria.
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-container-lowest rounded-b-xl border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {adjustments.map((a) => {
        const isDone = a.status === 'Done';
        const firstItem = a.items[0];
        const netDifference = a.items.reduce((acc, i) => acc + i.difference, 0);

        return (
          <div
            key={a.id}
            className="p-4 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors flex flex-col justify-between gap-3 border border-outline-variant/20 shadow-xs"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <span
                  onClick={() => onViewDetail(a)}
                  className="font-label-code text-label-code font-bold text-primary hover:underline cursor-pointer font-mono"
                >
                  {a.reference}
                </span>
                {getStatusBadge(a.status)}
              </div>

              {/* Location & Reason */}
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-code text-[11px] font-mono">
                  {a.locationName}
                </span>
                {a.reason && (
                  <span className="text-[11px] text-on-surface-variant italic truncate max-w-[150px]">
                    "{a.reason}"
                  </span>
                )}
              </div>

              {/* Product Info */}
              {firstItem && (
                <div className="mt-3 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                  <div className="font-semibold text-body-md text-on-surface truncate">
                    {firstItem.productName}
                    {a.items.length > 1 ? ` (+${a.items.length - 1} more items)` : ''}
                  </div>
                  <div className="font-mono text-[11px] text-on-surface-variant mt-0.5">
                    SKU: {firstItem.sku}
                  </div>

                  {/* Stock Comparison Grid */}
                  <div className="mt-2.5 pt-2 border-t border-surface-container grid grid-cols-3 gap-2 text-center text-body-sm">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                        Recorded
                      </span>
                      <span className="font-mono font-medium text-on-surface">
                        {firstItem.recordedStock}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                        Counted
                      </span>
                      <span className="font-mono font-bold text-on-surface">
                        {firstItem.physicalCount}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-0.5">
                        Variance
                      </span>
                      {getDifferenceBadge(netDifference)}
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-[11px] font-label-code text-on-surface-variant font-mono">
                Audit Date: {formatDate(a.createdAt)}
              </div>
            </div>

            {/* Actions footer */}
            <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onViewDetail(a)}
                className="text-body-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Audit Details</span>
              </button>

              {!isDone && (
                <button
                  type="button"
                  onClick={() => onValidate(a)}
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
