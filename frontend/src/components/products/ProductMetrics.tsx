import React from 'react';
import { ProductWithStock } from '../../types/product';

interface ProductMetricsProps {
  products: ProductWithStock[];
  selectedStatus?: string;
  onStatusClick?: (status: string) => void;
}

export const ProductMetrics: React.FC<ProductMetricsProps> = ({
  products,
  selectedStatus,
  onStatusClick,
}) => {
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.status === 'In Stock').length;
  const lowStockCount = products.filter((p) => p.status === 'Low Stock').length;
  const outOfStockCount = products.filter((p) => p.status === 'Out of Stock').length;

  const inStockPct = totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 1000) / 10 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
      {/* 1. Total Products */}
      <div
        onClick={() => onStatusClick && onStatusClick('all')}
        className={`bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-outline-variant/20 hover:shadow-md transition-all ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus === 'all' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Total Products
          </span>
          <div className="w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          </div>
        </div>
        <div className="mt-space-sm">
          <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
            {totalProducts.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
            <span className="inline-flex items-center text-primary font-semibold font-label-code text-label-code">
              Catalog Items
            </span>
            <span>registered in IMS</span>
          </div>
        </div>
      </div>

      {/* 2. In Stock */}
      <div
        onClick={() => onStatusClick && onStatusClick('In Stock')}
        className={`bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-outline-variant/20 hover:shadow-md transition-all ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'in stock' ? 'ring-2 ring-tertiary ring-offset-1' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            In Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
        </div>
        <div className="mt-space-sm">
          <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
            {inStockCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-tertiary-fixed/30 text-tertiary font-label-caps text-label-caps font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              {inStockPct}%
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">healthy inventory</span>
          </div>
        </div>
      </div>

      {/* 3. Low Stock */}
      <div
        onClick={() => onStatusClick && onStatusClick('Low Stock')}
        className={`bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-outline-variant/20 hover:shadow-md transition-all ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'low stock' ? 'ring-2 ring-secondary ring-offset-1' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Low Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
        </div>
        <div className="mt-space-sm">
          <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
            {lowStockCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary-fixed/40 text-secondary font-label-caps text-label-caps font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {lowStockCount} items
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">near reorder point</span>
          </div>
        </div>
      </div>

      {/* 4. Out of Stock */}
      <div
        onClick={() => onStatusClick && onStatusClick('Out of Stock')}
        className={`bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-outline-variant/20 hover:shadow-md transition-all ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'out of stock' ? 'ring-2 ring-error ring-offset-1' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Out of Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-error-container/40 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-[20px]">block</span>
          </div>
        </div>
        <div className="mt-space-sm">
          <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
            {outOfStockCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-error-container/50 text-error font-label-caps text-label-caps font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              {outOfStockCount} critical
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">reorders needed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
