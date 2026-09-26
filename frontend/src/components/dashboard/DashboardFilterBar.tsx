import React from 'react';
import { Warehouse } from '../../types/dashboard';

interface DashboardFilterBarProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  selectedWarehouseId: number | undefined;
  onWarehouseChange: (id: number | undefined) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  warehouses: Warehouse[];
  categories: string[];
  onClearFilters: () => void;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  searchTerm,
  onSearchChange,
  selectedWarehouseId,
  onWarehouseChange,
  selectedCategory,
  onCategoryChange,
  warehouses,
  categories,
  onClearFilters,
}) => {
  const typeOptions = [
    { id: 'all', label: 'All Types' },
    { id: 'receipt', label: 'Receipts' },
    { id: 'delivery', label: 'Deliveries' },
    { id: 'transfer', label: 'Internal' },
    { id: 'adjustment', label: 'Adjustments' },
  ];

  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'ready', label: 'Ready', dotColor: 'bg-tertiary', bgColor: 'bg-tertiary-fixed/40 text-tertiary' },
    { id: 'waiting', label: 'Waiting', dotColor: 'bg-secondary', bgColor: 'bg-secondary-fixed/50 text-secondary' },
    { id: 'draft', label: 'Draft', dotColor: 'bg-outline', bgColor: 'bg-surface-container text-on-surface-variant' },
    { id: 'done', label: 'Done', isDone: true, bgColor: 'bg-primary-fixed/40 text-primary' },
    { id: 'cancelled', label: 'Canceled', dotColor: 'bg-error', bgColor: 'bg-error-container/40 text-error' },
  ];

  let activeFiltersCount = 0;
  if (selectedType !== 'all') activeFiltersCount++;
  if (selectedStatus !== 'all') activeFiltersCount++;
  if (selectedWarehouseId !== undefined) activeFiltersCount++;
  if (selectedCategory !== 'all') activeFiltersCount++;
  if (searchTerm.trim() !== '') activeFiltersCount++;

  return (
    <div className="w-full bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col gap-3 border border-outline-variant/20">
      {/* Top Row: Type and Status Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Quick Type Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {typeOptions.map((type) => {
            const isActive = selectedType.toLowerCase() === type.id.toLowerCase();
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onTypeChange(type.id)}
                className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container font-medium'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Status Indicator Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold mr-1">
            Status:
          </span>
          {statusOptions.map((st) => {
            const isActive = selectedStatus.toLowerCase() === st.id.toLowerCase();
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onStatusChange(st.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-caps text-label-caps font-bold transition-all ${
                  isActive
                    ? 'ring-2 ring-primary ring-offset-1 ' + (st.bgColor || 'bg-primary text-on-primary')
                    : st.bgColor || 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {st.dotColor && <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />}
                {st.isDone && <span className="material-symbols-outlined text-[13px]">check_circle</span>}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-surface-container w-full" />

      {/* Bottom Row: Search, Warehouse, Category Dropdowns, and Filter Count/Clear */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="lg:col-span-5 relative">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search operation, SKU, reference, or batch..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-xs transition-colors"
          />
        </div>

        {/* Warehouse Dropdown */}
        <div className="lg:col-span-3">
          <div className="relative">
            <select
              aria-label="Filter by Warehouse"
              value={selectedWarehouseId !== undefined ? String(selectedWarehouseId) : 'all'}
              onChange={(e) => {
                const val = e.target.value;
                onWarehouseChange(val === 'all' ? undefined : Number(val));
              }}
              className="w-full h-8 px-2.5 rounded-lg bg-surface-container-low text-body-sm font-body-sm text-on-surface outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-7 truncate"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} {wh.code ? `(${wh.code})` : ''}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-2 text-on-surface-variant text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="lg:col-span-2">
          <div className="relative">
            <select
              aria-label="Filter by Product Category"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-surface-container-low text-body-sm font-body-sm text-on-surface outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-7 truncate"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-2 text-on-surface-variant text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Filters Count & Clear Button */}
        <div className="lg:col-span-2 flex items-center justify-end gap-2">
          <span className="px-2 py-0.5 rounded bg-surface-container font-label-code text-label-code text-on-surface-variant">
            Filters ({activeFiltersCount})
          </span>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-body-sm font-body-sm text-primary hover:underline font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
