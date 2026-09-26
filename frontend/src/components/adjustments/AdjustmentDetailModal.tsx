import React, { useState } from 'react';
import { Adjustment } from '../../types/adjustment';
import { formatDate } from '../../utils/formatters';

interface AdjustmentDetailModalProps {
  adjustment: Adjustment | null;
  onClose: () => void;
  onValidate: (adjustment: Adjustment) => Promise<void>;
}

export const AdjustmentDetailModal: React.FC<AdjustmentDetailModalProps> = ({
  adjustment,
  onClose,
  onValidate,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!adjustment) return null;

  const handleValidateClick = async () => {
    setIsValidating(true);
    setErrorMessage(null);
    try {
      await onValidate(adjustment);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed.';
      setErrorMessage(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const isDone = adjustment.status === 'Done';
  const totalCounted = adjustment.items.reduce((acc, i) => acc + i.physicalCount, 0);

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-surface-container-low flex items-start justify-between border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">fact_check</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface font-mono">
                {adjustment.reference}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Physical Inventory Audit Reconciled
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-start gap-2 text-body-sm">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                error_outline
              </span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Details Overview Grid */}
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div className="p-3 rounded-lg bg-surface-container-low/50 border border-outline-variant/10">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">
                Audit Location
              </span>
              <span className="font-semibold text-on-surface block truncate">
                {adjustment.locationName}
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                Zone #{adjustment.locationId}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low/50 border border-outline-variant/10">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">
                Audit Status
              </span>
              <span className="font-semibold font-mono text-on-surface capitalize">
                {adjustment.status}
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant block mt-0.5">
                {formatDate(adjustment.createdAt)}
              </span>
            </div>
          </div>

          {/* Reason */}
          {adjustment.reason && (
            <div className="p-3 rounded-lg bg-surface-container-low/30 border border-outline-variant/10 text-body-sm">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">
                Audit Reason / Justification
              </span>
              <p className="text-on-surface italic">"{adjustment.reason}"</p>
            </div>
          )}

          {/* Itemized Manifest */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-label-caps text-on-surface uppercase font-bold tracking-wider">
                Audited Products ({adjustment.items.length} items · {totalCounted} counted)
              </span>
            </div>

            <div className="divide-y divide-surface-container rounded-xl border border-outline-variant/20 overflow-hidden bg-surface-container-lowest">
              {adjustment.items.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-body-md text-on-surface truncate">
                      {item.productName}
                    </div>
                    <div className="font-mono text-[11px] text-on-surface-variant">
                      SKU: {item.sku}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase block">
                        Rec / Count
                      </span>
                      <span className="font-mono text-body-sm font-semibold text-on-surface">
                        {item.recordedStock} → {item.physicalCount}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase block">
                        Delta
                      </span>
                      {item.difference > 0 ? (
                        <span className="font-mono text-body-sm font-bold text-tertiary">
                          +{item.difference}
                        </span>
                      ) : item.difference < 0 ? (
                        <span className="font-mono text-body-sm font-bold text-error">
                          {item.difference}
                        </span>
                      ) : (
                        <span className="font-mono text-body-sm text-on-surface-variant">0</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors font-body-sm font-medium border border-outline-variant/20"
          >
            Close
          </button>

          {!isDone && (
            <button
              type="button"
              disabled={isValidating}
              onClick={handleValidateClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors font-body-sm font-semibold shadow-sm disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">
                    progress_activity
                  </span>
                  <span>Applying Reconciliation...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Validate & Post to Stock</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
