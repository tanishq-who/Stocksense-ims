import React from 'react';
import { Link } from 'react-router-dom';
import { LowStockProductItem } from '../../types/dashboard';

interface StockAlertsCardProps {
  alerts: LowStockProductItem[];
  searchTerm?: string;
}

export const StockAlertsCard: React.FC<StockAlertsCardProps> = ({ alerts, searchTerm = '' }) => {
  const filteredAlerts = alerts.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.product_name && item.product_name.toLowerCase().includes(term)) ||
      (item.sku && item.sku.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term)) ||
      (item.category && item.category.toLowerCase().includes(term))
    );
  });

  const displayAlerts = filteredAlerts.slice(0, 5);

  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col gap-4 border border-outline-variant/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-[22px]">notification_important</span>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Stock Alerts</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-caps text-label-caps font-bold">
          {filteredAlerts.length} items
        </span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Urgent action required on materials below safety reorder threshold.
      </p>

      {/* Alerts List */}
      <div className="flex flex-col gap-3">
        {displayAlerts.length === 0 ? (
          <div className="p-4 rounded-lg bg-surface-container-low text-center text-body-sm text-on-surface-variant">
            No active low-stock or out-of-stock alerts.
          </div>
        ) : (
          displayAlerts.map((item, idx) => {
            const isOutOfStock = item.available_quantity <= 0;
            return (
              <div
                key={item.product_id ? `${item.product_id}-${idx}` : idx}
                className="p-3 rounded-lg bg-surface-container-low/50 flex flex-col gap-1.5 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
                    {item.product_name || item.name || 'Product'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      isOutOfStock
                        ? 'bg-error text-on-error'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span
                    className={`font-label-code text-label-code font-bold font-mono ${
                      isOutOfStock ? 'text-error' : 'text-on-surface'
                    }`}
                  >
                    Stock: {item.available_quantity} {item.unit_of_measure || 'units'}
                  </span>
                  <span className="text-on-surface-variant font-mono text-[12px]">
                    Min safety: {item.reorder_level}
                  </span>
                </div>
                <div className="text-[11px] text-on-surface-variant flex items-center gap-1 truncate">
                  <span className="material-symbols-outlined text-[13px] text-outline">location_on</span>
                  <span className="truncate">{item.location || 'Warehouse Main'}</span>
                  <span className="text-outline/40">·</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">SKU: {item.sku}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Products Button */}
      <Link
        to="/products"
        className="w-full h-9 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-sm text-body-sm font-semibold flex items-center justify-center gap-2 shadow-xs"
      >
        <span className="material-symbols-outlined text-[18px]">inventory</span>
        <span>View All Products &amp; Reorder</span>
      </Link>
    </div>
  );
};
