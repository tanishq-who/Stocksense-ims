import React from 'react';

interface ProductFilterBarProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  categories: string[];
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  onClearFilters: () => void;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  categories,
  viewMode,
  onViewModeChange,
  onClearFilters,
}) => {
  let activeFiltersCount = 0;
  if (searchTerm.trim()) activeFiltersCount++;
  if (selectedCategory !== 'all') activeFiltersCount++;
  if (selectedStatus !== 'all') activeFiltersCount++;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-space-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by product name, SKU, or description..."
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-low transition-colors"
          />
        </div>

        {/* Filter Dropdowns & View Mode */}
        <div className="flex flex-wrap items-center gap-space-xs">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              aria-label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-10 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-low cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              aria-label="Filter by Status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-10 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-low cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface p-1 rounded-lg">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'table'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('card')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'card'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-space-xs pt-space-xs border-t border-surface-container">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
            Active Filters ({activeFiltersCount}):
          </span>
          {searchTerm.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container font-label-code text-label-code text-on-surface font-mono">
              Query: <strong className="font-medium">"{searchTerm}"</strong>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container font-label-code text-label-code text-on-surface">
              Category: <strong className="font-medium">{selectedCategory}</strong>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container font-label-code text-label-code text-on-surface">
              Status: <strong className="font-medium">{selectedStatus}</strong>
            </span>
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="font-body-sm text-body-sm text-primary hover:underline ml-1 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
