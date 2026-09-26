import React from 'react';
import { ProductWithStock } from '../../types/product';

interface ProductCardViewProps {
  products: ProductWithStock[];
  onEdit: (product: ProductWithStock) => void;
  onViewDetail: (product: ProductWithStock) => void;
}

export const ProductCardView: React.FC<ProductCardViewProps> = ({
  products,
  onEdit,
  onViewDetail,
}) => {
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/30 text-tertiary font-label-caps text-label-caps font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          In Stock
        </span>
      );
    }
    if (status === 'Low Stock') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed/40 text-secondary font-label-caps text-label-caps font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container/50 text-error font-label-caps text-label-caps font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-error" />
        Out of Stock
      </span>
    );
  };

  if (products.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-12 text-center text-on-surface-variant border border-outline-variant/20">
        No products found matching filter criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => {
        const reorderLvl = p.reorder_level || 10;
        const stockBarPct = Math.min(100, Math.round((p.stockOnHand / Math.max(reorderLvl * 2, 1)) * 100));

        let stockBarColor = 'bg-tertiary-container';
        if (p.status === 'Out of Stock') stockBarColor = 'bg-error';
        else if (p.status === 'Low Stock') stockBarColor = 'bg-secondary';

        return (
          <div
            key={p.id}
            className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
          >
            <div>
              {/* Top row: Category tag & Status badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-code text-[11px] truncate max-w-[130px]">
                  {p.category || 'General'}
                </span>
                {getStatusBadge(p.status)}
              </div>

              {/* Title & SKU */}
              <div className="mt-3 flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {getCategoryIcon(p.category)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    onClick={() => onViewDetail(p)}
                    className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate hover:text-primary cursor-pointer"
                  >
                    {p.name}
                  </h3>
                  <p className="font-label-code text-[11px] text-on-surface-variant font-mono mt-0.5">
                    {p.sku}
                  </p>
                </div>
              </div>

              {/* Price & Location */}
              <div className="mt-3 flex items-center justify-between text-body-sm text-on-surface-variant font-body-sm pt-2 border-t border-surface-container/60">
                <span className="font-bold text-on-surface font-mono">${p.price.toFixed(2)}</span>
                <span className="truncate max-w-[140px] text-[12px] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span className="truncate">{p.locationName || 'Unassigned'}</span>
                </span>
              </div>

              {/* Stock Bar */}
              <div className="mt-2.5 flex flex-col gap-1">
                <div className="flex items-center justify-between font-label-code text-[11px]">
                  <span className="font-bold text-on-surface font-mono">
                    Stock: {p.stockOnHand} {p.unit_of_measure}
                  </span>
                  <span className="text-on-surface-variant font-mono">Min: {p.reorder_level}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stockBarColor} transition-all`}
                    style={{ width: `${stockBarPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-surface-container/60 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onViewDetail(p)}
                className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface font-body-sm text-[12px] font-medium hover:bg-surface-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">visibility</span>
                <span>Details</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="px-2.5 py-1 rounded bg-primary-fixed/50 text-primary font-body-sm text-[12px] font-medium hover:bg-primary-fixed transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                <span>Edit</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
