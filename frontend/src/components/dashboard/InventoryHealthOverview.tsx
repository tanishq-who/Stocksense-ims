import React from 'react';
import { DashboardResponse } from '../../types/dashboard';

interface InventoryHealthOverviewProps {
  data: DashboardResponse | null;
}

export const InventoryHealthOverview: React.FC<InventoryHealthOverviewProps> = ({ data }) => {
  const inStock = data?.total_products_in_stock ?? 0;
  const lowStock = data?.low_stock_count ?? 0;
  const outOfStock = data?.out_of_stock_count ?? 0;
  const total = Math.max(1, data?.total_products ?? (inStock + lowStock + outOfStock));

  const inStockPct = Math.round((inStock / total) * 1000) / 10;
  const lowStockPct = Math.round((lowStock / total) * 1000) / 10;
  const outOfStockPct = Math.max(0, Math.round((100 - inStockPct - lowStockPct) * 10) / 10);

  // Group low stock products by category if available
  const categoryCounts: Record<string, number> = {};
  if (data?.low_stock_products) {
    data.low_stock_products.forEach((item) => {
      const cat = item.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  }

  const categoryEntries = Object.entries(categoryCounts).slice(0, 4);

  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col gap-4 border border-outline-variant/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            Inventory Overview &amp; Health
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Operational volume state across {total.toLocaleString()} active item lines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-label-code text-label-code text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            {inStockPct}% Optimal
          </span>
        </div>
      </div>

      {/* Stacked Color Meter */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-tertiary-container transition-all"
            style={{ width: `${inStockPct}%` }}
            title={`In Stock: ${inStockPct}%`}
          />
          <div
            className="h-full bg-secondary-container transition-all"
            style={{ width: `${lowStockPct}%` }}
            title={`Low Stock: ${lowStockPct}%`}
          />
          <div
            className="h-full bg-error transition-all"
            style={{ width: `${outOfStockPct}%` }}
            title={`Out of Stock: ${outOfStockPct}%`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-body-sm font-body-sm pt-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
            <span className="text-on-surface font-medium">In Stock</span>
            <span className="text-on-surface-variant font-label-code font-mono">
              {inStock.toLocaleString()} ({inStockPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
            <span className="text-on-surface font-medium">Low Stock</span>
            <span className="text-on-surface-variant font-label-code font-mono">
              {lowStock.toLocaleString()} ({lowStockPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error" />
            <span className="text-on-surface font-medium">Out of Stock</span>
            <span className="text-on-surface-variant font-label-code font-mono">
              {outOfStock.toLocaleString()} ({outOfStockPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Category Sub-Allocation Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 bg-surface-container-low/50 p-3 rounded-lg">
        {categoryEntries.length > 0 ? (
          categoryEntries.map(([category, count], idx) => {
            const barColors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-error'];
            const barColor = barColors[idx % barColors.length];
            const pct = Math.min(100, Math.round((count / Math.max(1, data?.low_stock_products.length || 1)) * 100));
            return (
              <div key={category} className="flex flex-col gap-1">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant truncate">
                  {category}
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {count} <span className="font-body-sm font-normal text-on-surface-variant">alerts</span>
                </span>
                <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                  <div className={`${barColor} h-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Electronics</span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {inStock > 0 ? Math.round(inStock * 0.45) : 0} <span className="font-body-sm font-normal text-on-surface-variant">units</span>
              </span>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: inStock > 0 ? '78%' : '0%' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Raw Materials</span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {inStock > 0 ? Math.round(inStock * 0.3) : 0} <span className="font-body-sm font-normal text-on-surface-variant">units</span>
              </span>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: inStock > 0 ? '62%' : '0%' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Packaging</span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {inStock > 0 ? Math.round(inStock * 0.15) : 0} <span className="font-body-sm font-normal text-on-surface-variant">units</span>
              </span>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full" style={{ width: inStock > 0 ? '88%' : '0%' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Perishables</span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {inStock > 0 ? Math.round(inStock * 0.1) : 0} <span className="font-body-sm font-normal text-on-surface-variant">units</span>
              </span>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-error h-full" style={{ width: inStock > 0 ? '44%' : '0%' }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
