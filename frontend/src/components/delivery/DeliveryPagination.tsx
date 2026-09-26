import React from 'react';

interface DeliveryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const DeliveryPagination: React.FC<DeliveryPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-space-md bg-surface-container-low gap-space-md font-body-sm text-body-sm text-on-surface-variant select-none rounded-b-xl border-t border-outline-variant/20">
      {/* Left: Summary and Rows per page */}
      <div className="flex flex-wrap items-center gap-space-lg">
        <span>
          Showing <strong className="text-on-surface font-semibold tabular-nums">{startItem}</strong> to{' '}
          <strong className="text-on-surface font-semibold tabular-nums">{endItem}</strong> of{' '}
          <strong className="text-on-surface font-semibold tabular-nums">{totalItems}</strong> deliveries
        </span>

        <div className="flex items-center gap-space-xs">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-surface-container-lowest text-on-surface px-2 py-1 rounded font-body-sm text-body-sm outline-none cursor-pointer border border-outline-variant/30"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Right: Page navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded flex items-center justify-center text-body-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
