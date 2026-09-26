import React from 'react';
import { MoveHistoryItem, MovementType } from '../../types/moveHistory';

interface MoveHistoryCardViewProps {
  items: MoveHistoryItem[];
  onSelectItem: (item: MoveHistoryItem) => void;
}

export const MoveHistoryCardView: React.FC<MoveHistoryCardViewProps> = ({
  items,
  onSelectItem,
}) => {
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const renderMovementTypeBadge = (type: MovementType, label: string) => {
    switch (type) {
      case 'receipt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-label-caps bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="material-symbols-outlined text-[13px]">call_received</span>
            <span>{label}</span>
          </span>
        );
      case 'delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-label-caps bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="material-symbols-outlined text-[13px]">local_shipping</span>
            <span>{label}</span>
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-label-caps bg-purple-50 text-purple-700 border border-purple-200">
            <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
            <span>{label}</span>
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-label-caps bg-amber-50 text-amber-700 border border-amber-200">
            <span className="material-symbols-outlined text-[13px]">tune</span>
            <span>{label}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-label-caps bg-surface-container text-on-surface-variant border border-outline-variant">
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
      {items.map((item) => {
        const isPositive = item.delta > 0;
        const isZero = item.delta === 0;

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Card Header: Reference, Type, Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="font-label-code text-label-code font-bold text-primary font-mono group-hover:underline">
                    {item.reference}
                  </span>
                  <span className="text-[11px] text-outline block font-mono">
                    {formatDateTime(item.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {renderMovementTypeBadge(item.movementType, item.movementTypeLabel)}
                </div>
              </div>

              {/* Product Info */}
              <div className="bg-surface-container-low rounded-lg p-3 mb-3 border border-outline-variant/20">
                <div className="font-semibold text-on-surface text-body-md truncate" title={item.productName}>
                  {item.productName}
                </div>
                <div className="text-[11px] text-on-surface-variant font-mono mt-0.5 flex items-center justify-between">
                  <span>SKU: {item.sku}</span>
                  {item.category && <span className="text-outline">{item.category}</span>}
                </div>
              </div>

              {/* Routing From -> To */}
              <div className="space-y-1.5 text-body-sm text-on-surface mb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-outline flex items-center gap-1 text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">logout</span>
                    From:
                  </span>
                  <span className="font-medium truncate max-w-[180px]">{item.fromLocation}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-outline flex items-center gap-1 text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">login</span>
                    To:
                  </span>
                  <span className="font-medium truncate max-w-[180px]">{item.toLocation}</span>
                </div>
              </div>
            </div>

            {/* Card Footer: Quantity Change and Ending Balance */}
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-outline uppercase font-label-caps block">Stock Change</span>
                <span
                  className={`font-mono font-bold text-[14px] ${
                    isPositive ? 'text-emerald-700' : isZero ? 'text-outline' : 'text-error'
                  }`}
                >
                  {isPositive ? `+${item.delta.toFixed(2)}` : item.delta.toFixed(2)} {item.unitOfMeasure}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-outline uppercase font-label-caps block">Ending Balance</span>
                <span className="font-mono font-semibold text-on-surface text-[13px]">
                  {item.balanceAfter.toFixed(2)} {item.unitOfMeasure}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
