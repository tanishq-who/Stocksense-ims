import React from 'react';
import { MoveHistoryItem } from '../../types/moveHistory';
import { Modal } from '../common/Modal';

interface MoveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MoveHistoryItem | null;
}

export const MoveDetailModal: React.FC<MoveDetailModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!item) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isPositive = item.delta > 0;
  const isZero = item.delta === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Move Record: ${item.reference}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header Summary Banner */}
        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                item.movementType === 'receipt'
                  ? 'bg-emerald-100 text-emerald-700'
                  : item.movementType === 'delivery'
                  ? 'bg-indigo-100 text-indigo-700'
                  : item.movementType === 'transfer'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <span className="material-symbols-outlined text-[26px]">
                {item.movementType === 'receipt'
                  ? 'call_received'
                  : item.movementType === 'delivery'
                  ? 'local_shipping'
                  : item.movementType === 'transfer'
                  ? 'swap_horiz'
                  : 'tune'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {item.movementTypeLabel}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-[11px] font-semibold">
                  LEDGER #{item.id}
                </span>
              </div>
              <div className="text-body-sm text-on-surface-variant font-mono mt-0.5">
                Committed {formatDate(item.timestamp)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-label-caps text-on-surface-variant uppercase tracking-wider">
              Stock Delta
            </div>
            <div
              className={`font-headline-lg text-headline-lg font-bold font-mono ${
                isPositive ? 'text-emerald-700' : isZero ? 'text-outline' : 'text-error'
              }`}
            >
              {isPositive ? `+${item.delta.toFixed(2)}` : item.delta.toFixed(2)} {item.unitOfMeasure}
            </div>
            <div className="text-body-sm text-on-surface-variant font-mono text-[11px]">
              Ending Balance: {item.balanceAfter.toFixed(2)} {item.unitOfMeasure}
            </div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Details */}
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 space-y-3">
            <h4 className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
              Product Information
            </h4>
            <div>
              <div className="font-semibold text-on-surface text-body-lg">
                {item.productName}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[12px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  SKU: {item.sku}
                </span>
                {item.category && (
                  <span className="text-[12px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Location & Routing Details */}
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 space-y-3">
            <h4 className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
              Logistics Routing
            </h4>
            <div className="space-y-2 text-body-md">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-outline">logout</span>
                  From:
                </span>
                <span className="font-medium text-on-surface">{item.fromLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-outline">login</span>
                  To:
                </span>
                <span className="font-medium text-on-surface">{item.toLocation}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                <span className="text-on-surface-variant">Storage Location:</span>
                <span className="font-semibold text-primary">{item.locationName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail Note / Reason */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 space-y-2">
          <h4 className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
            Audit Documentation & Rationale
          </h4>
          <p className="text-body-md text-on-surface bg-surface-container-low rounded-lg p-3 border border-outline-variant/20 font-mono text-[12px]">
            {item.reason || 'Standard inventory operation transaction posted automatically.'}
          </p>
        </div>

        {/* Status Confirmation Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span>Immutable ledger record verified in SQLite database.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-space-lg py-2 rounded-lg bg-surface-container text-on-surface font-medium hover:bg-surface-container-high transition-colors"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </Modal>
  );
};
