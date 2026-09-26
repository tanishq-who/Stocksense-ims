import React, { useState } from 'react';
import { Receipt } from '../../types/receipt';
import { formatDate } from '../../utils/formatters';

interface ReceiptDetailModalProps {
  receipt: Receipt | null;
  onClose: () => void;
  onValidate: (receipt: Receipt) => Promise<void>;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receipt,
  onClose,
  onValidate,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!receipt) return null;

  const handleValidateClick = async () => {
    setIsValidating(true);
    setErrorMessage(null);
    try {
      await onValidate(receipt);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed.';
      setErrorMessage(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const totalUnits = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-surface-container-low flex items-start justify-between border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">move_to_inbox</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface font-mono">
                {receipt.reference}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Supplier: <span className="font-medium text-on-surface">{receipt.supplier}</span>
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

        {/* Error message */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm font-body-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0">warning</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div className="p-3 rounded-xl bg-surface-container-low/60 flex flex-col">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Destination Bay
              </span>
              <span className="font-medium text-on-surface mt-1 truncate">
                {receipt.destinationLocationName}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/60 flex flex-col">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Status
              </span>
              <span className="font-medium text-on-surface mt-1 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    receipt.status === 'Done'
                      ? 'bg-primary'
                      : receipt.status === 'Ready'
                      ? 'bg-tertiary'
                      : receipt.status === 'Waiting'
                      ? 'bg-secondary'
                      : 'bg-outline'
                  }`}
                />
                {receipt.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/60 flex flex-col">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Scheduled Arrival
              </span>
              <span className="font-mono text-on-surface mt-1 text-[12px]">
                {formatDate(receipt.scheduledDate || receipt.createdAt)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/60 flex flex-col">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Total Volume
              </span>
              <span className="font-bold text-on-surface mt-1 font-mono">
                {receipt.items.length} Lines ({totalUnits} units)
              </span>
            </div>
          </div>

          {/* Item Lines Manifest */}
          <div className="pt-2">
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface block mb-2">
              Inbound Items Manifest
            </span>
            <div className="bg-surface rounded-xl overflow-hidden border border-outline-variant/30">
              <div className="px-3 py-2 bg-surface-container font-label-caps text-[10px] uppercase text-on-surface-variant grid grid-cols-12 gap-2">
                <div className="col-span-6 font-semibold">Product Name</div>
                <div className="col-span-3 font-semibold">SKU</div>
                <div className="col-span-3 text-right font-semibold">Quantity</div>
              </div>
              <div className="divide-y divide-surface-container text-body-sm">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6 font-medium text-on-surface truncate">
                      {item.productName}
                    </div>
                    <div className="col-span-3 font-label-code text-[11px] text-on-surface-variant font-mono truncate">
                      {item.sku}
                    </div>
                    <div className="col-span-3 text-right font-label-code font-bold text-on-surface font-mono">
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {receipt.status === 'Done' && (
            <div className="p-3 rounded-lg bg-tertiary-fixed/30 text-tertiary font-body-sm text-[12px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>
                Inventory counts were successfully posted to SQLite stock levels upon validation.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-lowest flex items-center justify-end gap-2 border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-body-sm text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Close
          </button>
          {receipt.status !== 'Done' && (
            <button
              type="button"
              disabled={isValidating}
              onClick={handleValidateClick}
              className="px-4 py-2 rounded-xl bg-tertiary-container text-on-tertiary font-body-sm text-body-sm font-semibold hover:bg-tertiary transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>{isValidating ? 'Validating...' : 'Validate Receipt & Post'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
