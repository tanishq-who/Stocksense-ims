import React, { useState } from 'react';
import { Delivery } from '../../types/delivery';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/formatters';

interface DeliveryDetailModalProps {
  delivery: Delivery | null;
  onClose: () => void;
  onValidate: (delivery: Delivery) => Promise<void>;
}

export const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({
  delivery,
  onClose,
  onValidate,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!delivery) return null;

  const handleValidateClick = async () => {
    setIsValidating(true);
    setErrorMessage(null);
    try {
      await onValidate(delivery);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed.';
      setErrorMessage(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const totalUnits = delivery.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const isDone = delivery.status === 'Done';
  const isCanceled = delivery.status === 'Canceled';

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-surface-container-low flex items-start justify-between border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">local_shipping</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface font-mono">
                  {delivery.reference}
                </h3>
                <StatusBadge status={delivery.status} />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Outbound Dispatch Operation
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
            <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-start gap-2 text-body-sm animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">
                warning
              </span>
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Route Overview Card */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3">
            <div className="text-[11px] font-label-caps uppercase tracking-wider text-outline">
              Delivery Logistics
            </div>
            <div className="grid grid-cols-2 gap-3 text-body-sm">
              <div>
                <span className="text-[11px] text-outline block">Source Location</span>
                <span className="font-medium text-on-surface flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">warehouse</span>
                  <span className="truncate">{delivery.fromLocation}</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-outline block">Destination / Customer</span>
                <span className="font-medium text-on-surface flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[15px] text-tertiary">pin_drop</span>
                  <span className="truncate">{delivery.toDestination}</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-outline block">Recipient Contact</span>
                <span className="font-medium text-on-surface flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">person</span>
                  <span className="truncate">{delivery.contactName}</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-outline block">Scheduled Date</span>
                <span className="font-mono text-on-surface mt-0.5 block">
                  {formatDate(delivery.scheduledDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Manifest Line Items
              </h4>
              <span className="font-label-code text-label-code text-on-surface-variant">
                {delivery.items.length} {delivery.items.length === 1 ? 'line' : 'lines'} &middot;{' '}
                {totalUnits} total units
              </span>
            </div>

            <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-[11px] uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="px-3 py-2 font-semibold">Product</th>
                    <th className="px-3 py-2 font-semibold">SKU</th>
                    <th className="px-3 py-2 font-semibold text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-body-md">
                  {delivery.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-surface-container-low/40">
                      <td className="px-3 py-2.5 font-medium text-on-surface">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-outline">
                        {item.sku || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-on-surface">
                        {item.quantity} <span className="text-[11px] text-outline font-normal">{item.unit || 'units'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes if available */}
          {delivery.notes && (
            <div className="p-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 text-body-sm">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">
                Dispatch Instructions
              </span>
              <p className="text-on-surface-variant italic">{delivery.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low/50 border-t border-surface-container flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-body-sm font-medium text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container transition-colors"
          >
            Close
          </button>

          {!isDone && !isCanceled && (
            <button
              type="button"
              disabled={isValidating}
              onClick={handleValidateClick}
              className="px-5 py-2 text-body-sm font-medium bg-primary hover:bg-primary-container text-white rounded-xl shadow-sm shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isValidating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validating Stock...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Validate &amp; Dispatch</span>
                </>
              )}
            </button>
          )}

          {isDone && (
            <div className="flex items-center gap-1.5 text-tertiary text-body-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Validated &amp; Recorded to Ledger</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
