import React, { useState } from 'react';
import { Receipt } from '../../types/receipt';
import { formatDate, getInitials } from '../../utils/formatters';

interface ReceiptTableProps {
  receipts: Receipt[];
  onValidate: (receipt: Receipt) => void;
  onViewDetail: (receipt: Receipt) => void;
}

export const ReceiptTable: React.FC<ReceiptTableProps> = ({
  receipts,
  onValidate,
  onViewDetail,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const total = receipts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageReceipts = receipts.slice(startIndex, startIndex + pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.size === pageReceipts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageReceipts.map((r) => r.id)));
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
                  checked={pageReceipts.length > 0 && selectedIds.size === pageReceipts.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all receipts"
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </th>
              <th className="px-space-md py-2.5 font-semibold">Reference</th>
              <th className="px-space-md py-2.5 font-semibold">Supplier</th>
              <th className="px-space-md py-2.5 font-semibold">Destination Bay</th>
              <th className="px-space-md py-2.5 font-semibold">Scheduled Date</th>
              <th className="px-space-md py-2.5 font-semibold">Products Manifest</th>
              <th className="px-space-md py-2.5 font-semibold">Status</th>
              <th className="px-space-md py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md divide-y divide-surface-container text-on-surface">
            {pageReceipts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                  No inbound receipts match current filters.
                </td>
              </tr>
            ) : (
              pageReceipts.map((r) => {
                const isSelected = selectedIds.has(r.id);
                const totalUnits = r.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-surface-container-low/60 transition-colors group ${
                      isSelected ? 'bg-surface-container-low/70' : ''
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(r.id)}
                        aria-label={`Select ${r.reference}`}
                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      />
                    </td>
                    <td
                      onClick={() => onViewDetail(r)}
                      className="px-space-md py-3 font-label-code text-label-code font-bold text-primary hover:underline cursor-pointer font-mono"
                    >
                      {r.reference}
                    </td>
                    <td className="px-space-md py-3 font-medium text-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold flex items-center justify-center shrink-0">
                          {getInitials(r.supplier)}
                        </span>
                        <span className="truncate max-w-[180px]">{r.supplier}</span>
                      </div>
                    </td>
                    <td className="px-space-md py-3 text-on-surface-variant">
                      <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                        <span className="material-symbols-outlined text-[14px] text-tertiary">
                          warehouse
                        </span>
                        <span className="truncate">{r.destinationLocationName}</span>
                      </span>
                    </td>
                    <td className="px-space-md py-3 font-label-code text-label-code text-on-surface-variant font-mono">
                      {formatDate(r.scheduledDate || r.createdAt)}
                    </td>
                    <td className="px-space-md py-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-high text-on-surface text-body-sm font-medium">
                        <span className="material-symbols-outlined text-[15px] text-primary">
                          inventory
                        </span>
                        <span>
                          {r.items.length} {r.items.length === 1 ? 'item' : 'items'} ({totalUnits}{' '}
                          units)
                        </span>
                      </div>
                    </td>
                    <td className="px-space-md py-3">{getStatusBadge(r.status)}</td>
                    <td className="px-space-md py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== 'Done' && (
                          <button
                            type="button"
                            onClick={() => onValidate(r)}
                            className="px-2.5 py-1 rounded-lg bg-tertiary-container text-on-tertiary font-body-sm text-[12px] font-semibold hover:bg-tertiary transition-colors shadow-xs flex items-center gap-1"
                            title="Validate Receipt & Increase Stock"
                          >
                            <span className="material-symbols-outlined text-[15px]">verified</span>
                            <span>Validate</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewDetail(r)}
                          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                          title="View Details"
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
        <div className="px-space-lg py-space-sm bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-md text-on-surface-variant font-body-sm text-body-sm border-t border-surface-container">
          <div className="flex items-center gap-space-md">
            <span>
              Showing <strong className="text-on-surface font-medium">{startIndex + 1} to {Math.min(startIndex + pageSize, total)}</strong> of{' '}
              <strong className="text-on-surface font-medium">{total}</strong> receipts
            </span>
            <div className="flex items-center gap-1.5 pl-space-md border-l border-surface-container">
              <span>Rows:</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface font-label-code text-label-code rounded px-1.5 py-0.5 text-on-surface focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-center text-[12px] font-semibold transition-colors ${
                  currentPage === page
                    ? 'bg-primary-container text-on-primary'
                    : 'hover:bg-surface-container text-on-surface'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
              title="Next Page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
