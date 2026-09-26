import React, { useState } from 'react';
import { MoveHistoryItem, MovementType } from '../../types/moveHistory';

interface MoveHistoryTableProps {
  items: MoveHistoryItem[];
  onSelectItem: (item: MoveHistoryItem) => void;
}

export const MoveHistoryTable: React.FC<MoveHistoryTableProps> = ({
  items,
  onSelectItem,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const datePart = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return { datePart, timePart };
    } catch {
      return { datePart: isoString, timePart: '' };
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
    <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all border border-outline-variant/30">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider h-10 select-none border-b border-outline-variant/20">
              <th className="w-10 px-4 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  aria-label="Select all movements"
                />
              </th>
              <th className="px-space-md py-2 font-semibold">Reference</th>
              <th className="px-space-md py-2 font-semibold">Date / Time</th>
              <th className="px-space-md py-2 font-semibold">Product</th>
              <th className="px-space-md py-2 font-semibold">Movement Type</th>
              <th className="px-space-md py-2 font-semibold">From</th>
              <th className="px-space-md py-2 font-semibold">To</th>
              <th className="px-space-md py-2 font-semibold">Quantity / Change</th>
              <th className="px-space-md py-2 font-semibold">Status</th>
              <th className="w-12 px-space-md py-2 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container font-body-md text-body-md text-on-surface">
            {items.map((item) => {
              const isChecked = selectedIds.includes(item.id);
              const { datePart, timePart } = formatDateTime(item.timestamp);
              const isPositive = item.delta > 0;
              const isZero = item.delta === 0;

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="hover:bg-surface-container-low/70 transition-colors group cursor-pointer"
                >
                  {/* Checkbox */}
                  <td
                    className="w-10 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      aria-label={`Select ${item.reference}`}
                    />
                  </td>

                  {/* Reference */}
                  <td className="px-space-md py-3 font-label-code text-label-code font-semibold">
                    <span className="flex items-center gap-1 font-mono text-primary group-hover:underline">
                      <span>{item.reference}</span>
                      <span className="material-symbols-outlined text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">
                        open_in_new
                      </span>
                    </span>
                    <span className="text-[10px] text-outline block font-mono">
                      #{item.id}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="px-space-md py-3 text-body-sm whitespace-nowrap">
                    <div className="font-medium text-on-surface">{datePart}</div>
                    <div className="text-[11px] text-on-surface-variant font-mono">{timePart}</div>
                  </td>

                  {/* Product */}
                  <td className="px-space-md py-3">
                    <div className="font-medium text-on-surface max-w-[200px] truncate" title={item.productName}>
                      {item.productName}
                    </div>
                    <div className="text-[11px] text-on-surface-variant font-mono flex items-center gap-1">
                      <span>SKU: {item.sku}</span>
                      {item.category && (
                        <>
                          <span>•</span>
                          <span className="text-outline">{item.category}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Movement Type */}
                  <td className="px-space-md py-3 whitespace-nowrap">
                    {renderMovementTypeBadge(item.movementType, item.movementTypeLabel)}
                  </td>

                  {/* From */}
                  <td className="px-space-md py-3 text-body-sm">
                    <span className="text-on-surface max-w-[160px] truncate block" title={item.fromLocation}>
                      {item.fromLocation}
                    </span>
                  </td>

                  {/* To */}
                  <td className="px-space-md py-3 text-body-sm">
                    <span className="text-on-surface max-w-[160px] truncate block font-medium" title={item.toLocation}>
                      {item.toLocation}
                    </span>
                  </td>

                  {/* Quantity / Stock Change */}
                  <td className="px-space-md py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 font-mono font-semibold">
                      {isPositive ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[12px]">
                          <span>+{item.delta.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-600 font-normal">{item.unitOfMeasure}</span>
                        </span>
                      ) : isZero ? (
                        <span className="inline-flex items-center gap-0.5 text-outline bg-surface-container border border-outline-variant px-2 py-0.5 rounded text-[12px]">
                          <span>0.00</span>
                          <span className="text-[10px] font-normal">{item.unitOfMeasure}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[12px]">
                          <span>{item.delta.toFixed(2)}</span>
                          <span className="text-[10px] text-rose-600 font-normal">{item.unitOfMeasure}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                      Bal: <strong className="text-on-surface">{item.balanceAfter.toFixed(2)}</strong> {item.unitOfMeasure}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-space-md py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#c7d2fe] bg-[#eef2ff] text-[#4338ca] px-2.5 py-0.5 text-[11px] font-label-caps font-semibold uppercase tracking-wider select-none">
                      <span className="material-symbols-outlined text-[13px]">check</span>
                      <span>Done</span>
                    </span>
                  </td>

                  {/* Actions / Audit Inspection */}
                  <td
                    className="w-12 px-space-md py-3 text-right"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item);
                    }}
                  >
                    <button
                      type="button"
                      title="Inspect Ledger Entry"
                      className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
