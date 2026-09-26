import React, { useState } from 'react';
import { Transfer } from '../../types/transfer';
import { formatDate } from '../../utils/formatters';

interface TransferTableProps {
  transfers: Transfer[];
  onValidate: (transfer: Transfer) => void;
  onViewDetail: (transfer: Transfer) => void;
}

export const TransferTable: React.FC<TransferTableProps> = ({
  transfers,
  onValidate,
  onViewDetail,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const total = transfers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageTransfers = transfers.slice(startIndex, startIndex + pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.size === pageTransfers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageTransfers.map((t) => t.id)));
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

  return (
    <div className="w-full bg-surface-container-lowest rounded-b-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/20">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider select-none">
              <th className="w-10 px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={pageTransfers.length > 0 && selectedIds.size === pageTransfers.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all transfers"
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </th>
              <th className="px-space-md py-2.5 font-semibold">Reference</th>
              <th className="px-space-md py-2.5 font-semibold">From (Origin)</th>
              <th className="px-space-md py-2.5 font-semibold">To (Destination)</th>
              <th className="px-space-md py-2.5 font-semibold">Products / Payload</th>
              <th className="px-space-md py-2.5 font-semibold">Scheduled Date</th>
              <th className="px-space-md py-2.5 font-semibold">Status</th>
              <th className="px-space-md py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md divide-y divide-surface-container text-on-surface">
            {pageTransfers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                  No internal transfers match current filters.
                </td>
              </tr>
            ) : (
              pageTransfers.map((t) => {
                const totalUnits = t.items.reduce((sum, item) => sum + item.quantity, 0);
                const isDone = t.status === 'Done';

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-container-low/50 transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelectOne(t.id)}
                        aria-label={`Select transfer ${t.reference}`}
                        className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                    </td>

                    {/* Reference */}
                    <td className="px-space-md py-3">
                      <span
                        onClick={() => onViewDetail(t)}
                        className="font-label-code text-label-code font-bold text-primary group-hover:underline cursor-pointer font-mono"
                      >
                        {t.reference}
                      </span>
                      <span className="block font-body-sm text-[11px] text-on-surface-variant">
                        Transfer #{t.id}
                      </span>
                    </td>

                    {/* From (Source) */}
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          warehouse
                        </span>
                        <span className="truncate max-w-[160px]">{t.sourceLocationName}</span>
                      </div>
                      <span className="font-label-code text-[11px] text-on-surface-variant font-mono">
                        Zone #{t.sourceLocationId}
                      </span>
                    </td>

                    {/* To (Destination) */}
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">
                          move_to_inbox
                        </span>
                        <span className="truncate max-w-[160px]">{t.destinationLocationName}</span>
                      </div>
                      <span className="font-label-code text-[11px] text-on-surface-variant font-mono">
                        Zone #{t.destinationLocationId}
                      </span>
                    </td>

                    {/* Products / Payload */}
                    <td className="px-space-md py-3">
                      <span className="font-semibold text-on-surface">
                        {t.items.length} {t.items.length === 1 ? 'item' : 'items'} ({totalUnits} units)
                      </span>
                      <div className="font-body-sm text-[11px] text-on-surface-variant truncate max-w-[180px]">
                        {t.items.map((i) => i.productName).join(', ') || 'No line items'}
                      </div>
                    </td>

                    {/* Scheduled Date */}
                    <td className="px-space-md py-3 font-label-code text-body-sm font-mono text-on-surface-variant">
                      {formatDate(t.scheduledDate || t.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="px-space-md py-3">{getStatusBadge(t.status)}</td>

                    {/* Actions */}
                    <td className="px-space-md py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => onValidate(t)}
                            title="Validate & relocate stock in SQLite ledger"
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
                          onClick={() => onViewDetail(t)}
                          title="View transfer details"
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
