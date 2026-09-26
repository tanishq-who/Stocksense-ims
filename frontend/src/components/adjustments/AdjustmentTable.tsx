import React, { useState } from 'react';
import { Adjustment } from '../../types/adjustment';
import { formatDate } from '../../utils/formatters';

interface AdjustmentTableProps {
  adjustments: Adjustment[];
  onValidate: (adjustment: Adjustment) => void;
  onViewDetail: (adjustment: Adjustment) => void;
}

export const AdjustmentTable: React.FC<AdjustmentTableProps> = ({
  adjustments,
  onValidate,
  onViewDetail,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const total = adjustments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageAdjustments = adjustments.slice(startIndex, startIndex + pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.size === pageAdjustments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageAdjustments.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

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

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('elect') || c.includes('battery')) return 'bolt';
    if (c.includes('pack')) return 'package_2';
    if (c.includes('hardware') || c.includes('hydraul')) return 'build';
    return 'inventory_2';
  };

  return (
    <div className="w-full bg-surface-container-lowest rounded-b-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/20">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider select-none h-10">
              <th className="w-10 px-4 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={pageAdjustments.length > 0 && selectedIds.size === pageAdjustments.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all adjustments"
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </th>
              <th className="px-space-md py-2.5 font-semibold">Reference</th>
              <th className="px-space-md py-2.5 font-semibold">Product & SKU</th>
              <th className="px-space-md py-2.5 font-semibold">Location</th>
              <th className="px-space-md py-2.5 font-semibold text-right">Recorded Stock</th>
              <th className="px-space-md py-2.5 font-semibold text-right">Counted Stock</th>
              <th className="px-space-md py-2.5 font-semibold text-center">Difference</th>
              <th className="px-space-md py-2.5 font-semibold">Date / Time</th>
              <th className="px-space-md py-2.5 font-semibold">Status</th>
              <th className="px-space-md py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md divide-y divide-surface-container text-on-surface">
            {pageAdjustments.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-on-surface-variant">
                  No inventory adjustment records match current filters.
                </td>
              </tr>
            ) : (
              pageAdjustments.map((a) => {
                const isDone = a.status === 'Done';
                const firstItem = a.items[0];
                const netDifference = a.items.reduce((acc, i) => acc + i.difference, 0);

                return (
                  <tr
                    key={a.id}
                    className="hover:bg-surface-container-low/50 transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(a.id)}
                        onChange={() => toggleSelectOne(a.id)}
                        aria-label={`Select adjustment ${a.reference}`}
                        className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                    </td>

                    {/* Reference */}
                    <td className="px-space-md py-3">
                      <span
                        onClick={() => onViewDetail(a)}
                        className="font-label-code text-label-code font-bold text-primary group-hover:underline cursor-pointer font-mono"
                      >
                        {a.reference}
                      </span>
                      {a.reason && (
                        <span className="block font-body-sm text-[11px] text-on-surface-variant truncate max-w-[140px]">
                          {a.reason}
                        </span>
                      )}
                    </td>

                    {/* Product & SKU */}
                    <td className="px-space-md py-3">
                      {firstItem ? (
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">
                              {getCategoryIcon(firstItem.category)}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-on-surface truncate max-w-[190px]">
                              {firstItem.productName}
                              {a.items.length > 1 ? ` (+${a.items.length - 1} more)` : ''}
                            </span>
                            <div className="flex items-center gap-1 font-label-code text-[11px] text-on-surface-variant font-mono">
                              <span>{firstItem.sku}</span>
                              <span>•</span>
                              <span className="text-secondary">{firstItem.category}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant text-body-sm">No items</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-space-md py-3">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-code text-label-code font-mono">
                        {a.locationName}
                      </span>
                    </td>

                    {/* Recorded Stock */}
                    <td className="px-space-md py-3 text-right font-label-code text-label-code text-on-surface-variant font-mono">
                      {firstItem ? `${firstItem.recordedStock} ${firstItem.unit}` : '—'}
                    </td>

                    {/* Counted Stock */}
                    <td className="px-space-md py-3 text-right font-label-code text-label-code font-bold text-on-surface font-mono">
                      {firstItem ? `${firstItem.physicalCount} ${firstItem.unit}` : '—'}
                    </td>

                    {/* Difference */}
                    <td className="px-space-md py-3 text-center">
                      {a.items.length === 1 && firstItem
                        ? getDifferenceBadge(firstItem.difference)
                        : getDifferenceBadge(netDifference)}
                    </td>

                    {/* Date / Time */}
                    <td className="px-space-md py-3 text-on-surface-variant font-body-sm text-body-sm whitespace-nowrap font-mono text-[11px]">
                      {formatDate(a.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="px-space-md py-3">{getStatusBadge(a.status)}</td>

                    {/* Actions */}
                    <td className="px-space-md py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => onValidate(a)}
                            title="Validate & update StockLevel and Ledger"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant hover:bg-tertiary hover:text-on-tertiary transition-colors font-body-sm text-body-sm font-medium shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              check_circle
                            </span>
                            <span>Validate</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewDetail(a)}
                          title="View adjustment details"
                          className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="p-3 bg-surface-container-low/50 border-t border-surface-container flex flex-wrap items-center justify-between gap-2 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface text-body-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-outline">|</span>
            <span>
              Showing {startIndex + 1}–{Math.min(startIndex + pageSize, total)} of {total}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="font-mono text-body-sm px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
