import React, { useState } from 'react';
import { ProductWithStock } from '../../types/product';

interface ProductTableProps {
  products: ProductWithStock[];
  onEdit: (product: ProductWithStock) => void;
  onViewDetail: (product: ProductWithStock) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onViewDetail }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageProducts = products.slice(startIndex, startIndex + pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.size === pageProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageProducts.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const getCategoryIcon = (category?: string | null) => {
    const c = (category || '').toLowerCase();
    if (c.includes('elect')) return 'battery_charging_full';
    if (c.includes('pack')) return 'package_2';
    if (c.includes('hard') || c.includes('tool')) return 'build_circle';
    if (c.includes('raw') || c.includes('chem')) return 'science';
    return 'inventory_2';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'In Stock') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed/30 text-tertiary font-label-caps text-label-caps font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          In Stock
        </span>
      );
    }
    if (status === 'Low Stock') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed/40 text-secondary font-label-caps text-label-caps font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container/50 text-error font-label-caps text-label-caps font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-error" />
        Out of Stock
      </span>
    );
  };

  return (
    <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/20">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left font-body-sm text-body-sm">
          <thead className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
            <tr>
              <th className="w-10 px-4 py-3 text-center" scope="col">
                <input
                  type="checkbox"
                  checked={pageProducts.length > 0 && selectedIds.size === pageProducts.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all products"
                  className="rounded cursor-pointer accent-primary"
                />
              </th>
              <th className="px-4 py-3" scope="col">Product Name</th>
              <th className="px-4 py-3" scope="col">SKU / Code</th>
              <th className="px-4 py-3" scope="col">Category</th>
              <th className="px-4 py-3" scope="col">UOM</th>
              <th className="px-4 py-3" scope="col">Price</th>
              <th className="px-4 py-3" scope="col">Stock on Hand</th>
              <th className="px-4 py-3" scope="col">Location</th>
              <th className="px-4 py-3" scope="col">Reorder Point</th>
              <th className="px-4 py-3" scope="col">Status</th>
              <th className="px-4 py-3 text-right" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container/60 text-on-surface">
            {pageProducts.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-on-surface-variant">
                  No products found.
                </td>
              </tr>
            ) : (
              pageProducts.map((p) => {
                const isSelected = selectedIds.has(p.id);
                const reorderLvl = p.reorder_level || 10;
                const stockBarPct = Math.min(100, Math.round((p.stockOnHand / Math.max(reorderLvl * 2, 1)) * 100));

                let stockTextColor = 'text-tertiary';
                let stockBarColor = 'bg-tertiary-container';
                if (p.status === 'Out of Stock') {
                  stockTextColor = 'text-error';
                  stockBarColor = 'bg-error';
                } else if (p.status === 'Low Stock') {
                  stockTextColor = 'text-secondary';
                  stockBarColor = 'bg-secondary';
                }

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-surface-container-low transition-colors group ${
                      isSelected ? 'bg-surface-container-low/70' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(p.id)}
                        aria-label={`Select ${p.name}`}
                        className="rounded accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {getCategoryIcon(p.category)}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0 max-w-[200px]">
                          <span
                            onClick={() => onViewDetail(p)}
                            className="font-medium text-on-surface truncate hover:text-primary cursor-pointer"
                          >
                            {p.name}
                          </span>
                          {p.description && (
                            <span className="text-on-surface-variant text-[11px] truncate">
                              {p.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-label-code text-label-code text-on-surface-variant font-mono">
                      {p.sku}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-label-code font-label-code">
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-label-code text-label-code font-mono">
                      {p.unit_of_measure}
                    </td>
                    <td className="px-4 py-2.5 font-label-code text-label-code font-mono text-on-surface">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold font-mono ${stockTextColor}`}>
                          {p.stockOnHand} {p.unit_of_measure}
                        </span>
                        <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className={`h-full ${stockBarColor} transition-all`}
                            style={{ width: `${stockBarPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] truncate max-w-[140px]">
                        <span className="material-symbols-outlined text-[16px]">warehouse</span>
                        <span className="truncate">{p.locationName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-label-code text-label-code text-on-surface-variant font-mono">
                      Min: {p.reorder_level}
                    </td>
                    <td className="px-4 py-2.5">{getStatusBadge(p.status)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDetail(p)}
                          title="View Details"
                          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          title="Quick Edit"
                          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
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
        <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-on-surface-variant border-t border-surface-container">
          <div className="flex items-center gap-space-md">
            <span>
              Showing <strong className="text-on-surface font-medium">{startIndex + 1} to {Math.min(startIndex + pageSize, total)}</strong> of{' '}
              <strong className="text-on-surface font-medium">{total}</strong> products
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface rounded px-2 py-0.5 text-on-surface font-label-code text-label-code focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-surface text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded font-medium flex items-center justify-center transition-colors ${
                  currentPage === page
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'bg-surface text-on-surface hover:bg-surface-container'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-surface text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
