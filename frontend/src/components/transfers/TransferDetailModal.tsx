import React, { useState } from 'react';
import { Transfer } from '../../types/transfer';
import { formatDate } from '../../utils/formatters';

interface TransferDetailModalProps {
  transfer: Transfer | null;
  onClose: () => void;
  onValidate: (transfer: Transfer) => Promise<void>;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
  transfer,
  onClose,
  onValidate,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!transfer) return null;

  const handleValidateClick = async () => {
    setIsValidating(true);
    setErrorMessage(null);
    try {
      await onValidate(transfer);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed.';
      setErrorMessage(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const totalUnits = transfer.items.reduce((sum, item) => sum + item.quantity, 0);
  const isDone = transfer.status === 'Done';

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-surface-container-low flex items-start justify-between border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface font-mono">
                {transfer.reference}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Inter-Facility Stock Relocation
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

          {/* Route Specification */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block">
                Origin Bay
              </span>
              <span className="font-semibold text-on-surface text-body-md block truncate">
                {transfer.sourceLocationName}
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                Zone #{transfer.sourceLocationId}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>

            <div className="flex-1 text-right">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block">
                Destination Bay
              </span>
              <span className="font-semibold text-on-surface text-body-md block truncate">
                {transfer.destinationLocationName}
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                Zone #{transfer.destinationLocationId}
              </span>
            </div>
          </div>

          {/* Transfer Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div className="p-3 rounded-lg bg-surface-container-low/50 border border-outline-variant/10">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">
                Current Status
              </span>
              <span className="font-semibold font-mono text-on-surface capitalize">
                {transfer.status}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low/50 border border-outline-variant/10">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">
                Dispatch Schedule
              </span>
              <span className="font-mono text-[11px] text-on-surface font-semibold">
                {formatDate(transfer.scheduledDate || transfer.createdAt)}
              </span>
            </div>
          </div>

          {/* Items Manifest List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-label-caps text-on-surface uppercase font-bold tracking-wider">
                Payload Manifest ({transfer.items.length} items · {totalUnits} total units)
              </span>
            </div>

            <div className="divide-y divide-surface-container rounded-xl border border-outline-variant/20 overflow-hidden bg-surface-container-lowest">
              {transfer.items.length === 0 ? (
                <div className="p-4 text-center text-body-sm text-on-surface-variant">
                  No line items in this transfer.
                </div>
              ) : (
                transfer.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-body-md text-on-surface truncate">
                        {item.productName}
                      </div>
                      <div className="font-mono text-[11px] text-on-surface-variant">
                        SKU: {item.sku}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface font-mono">
                        {item.quantity}
                      </span>
                      <span className="text-[11px] text-on-surface-variant block font-mono">
                        {item.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
                  <span>Validating Stock Movement...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Validate & Relocate Stock</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
