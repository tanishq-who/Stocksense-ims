import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BackendOperation } from '../../types/delivery';
import { formatDate } from '../../utils/formatters';

interface RecentOperationsTableProps {
  operations: BackendOperation[];
  searchTerm?: string;
}

export const RecentOperationsTable: React.FC<RecentOperationsTableProps> = ({
  operations,
  searchTerm = '',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Filter by search term if provided
  const filtered = operations.filter((op) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (op.reference && op.reference.toLowerCase().includes(term)) ||
      (op.operation_type && op.operation_type.toLowerCase().includes(term)) ||
      (op.customer && op.customer.toLowerCase().includes(term)) ||
      (op.supplier && op.supplier.toLowerCase().includes(term)) ||
      (op.status && op.status.toLowerCase().includes(term))
    );
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedOps = filtered.slice(startIndex, startIndex + pageSize);

  const getOpBadge = (opType: string) => {
    const t = (opType || '').toLowerCase();
    if (t === 'receipt') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-fixed/30 text-secondary">
          <span className="material-symbols-outlined text-[13px]">south_east</span> Receipt
        </span>
      );
    }
    if (t === 'delivery') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-tertiary-fixed/40 text-tertiary">
          <span className="material-symbols-outlined text-[13px]">north_east</span> Delivery
        </span>
      );
    }
    if (t === 'transfer') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-fixed/40 text-primary">
          <span className="material-symbols-outlined text-[13px]">sync_alt</span> Transfer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant">
        <span className="material-symbols-outlined text-[13px]">tune</span> Adjustment
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'ready') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-caps text-label-caps font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Ready
        </span>
      );
    }
    if (s === 'waiting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary font-label-caps text-label-caps font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Waiting
        </span>
      );
    }
    if (s === 'done') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-label-caps text-label-caps font-bold">
          <span className="material-symbols-outlined text-[13px]">check_circle</span> Done
        </span>
      );
    }
    if (s === 'cancelled' || s === 'canceled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container/40 text-error font-label-caps text-label-caps font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-error" /> Canceled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-label-caps font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-outline" /> Draft
      </span>
    );
  };

  const getRouteLabel = (op: BackendOperation) => {
    const partner = op.customer || op.supplier || (op.reason ? `Reason: ${op.reason}` : 'Internal Route');
    const fromLoc = op.source_location_id ? `Loc #${op.source_location_id}` : 'Origin';
    const toLoc = op.destination_location_id ? `Loc #${op.destination_location_id}` : 'Destination';

    return (
      <div>
        <div className="font-medium text-on-surface truncate max-w-[240px]">{partner}</div>
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
          <span>{fromLoc}</span>
          <span className="material-symbols-outlined text-[12px]">arrow_right_alt</span>
          <span className="font-medium text-on-surface">{toLoc}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/20">
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between bg-surface-container-lowest">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Recent Operations</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Real-time log of inbound, outbound, and inter-facility movements
          </p>
        </div>
        <Link
          to="/operations/deliveries"
          className="text-primary hover:text-primary-container font-body-sm text-body-sm font-semibold flex items-center gap-1"
        >
          <span>View Full Log</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-body-sm font-body-sm">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase h-9">
              <th className="py-2 px-4 font-semibold">Reference</th>
              <th className="py-2 px-3 font-semibold">Operation</th>
              <th className="py-2 px-3 font-semibold">From / To Route</th>
              <th className="py-2 px-3 font-semibold">Scheduled Date</th>
              <th className="py-2 px-3 font-semibold">Status</th>
              <th className="py-2 px-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low/80">
            {pagedOps.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                  No operations match current filters.
                </td>
              </tr>
            ) : (
              pagedOps.map((op) => (
                <tr key={op.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-2.5 px-4 font-label-code text-label-code font-bold text-primary font-mono">
                    {op.reference}
                  </td>
                  <td className="py-2.5 px-3">{getOpBadge(op.operation_type)}</td>
                  <td className="py-2.5 px-3">{getRouteLabel(op)}</td>
                  <td className="py-2.5 px-3 font-label-code text-label-code text-on-surface-variant font-mono">
                    {formatDate(op.scheduled_date || op.created_at)}
                  </td>
                  <td className="py-2.5 px-3">{getStatusBadge(op.status)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to="/operations/deliveries"
                      className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors inline-block"
                      title="Inspect Operation"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="px-4 py-3 bg-surface-container-lowest flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant border-t border-surface-container">
          <div>
            Showing <span className="font-semibold text-on-surface">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-on-surface">{Math.min(startIndex + pageSize, total)}</span> of{' '}
            <span className="font-semibold text-on-surface">{total}</span> operations
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded text-body-sm font-body-sm transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container-low text-on-surface font-medium hover:bg-surface-container'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
