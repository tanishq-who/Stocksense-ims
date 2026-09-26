import React from 'react';

interface DeliveryFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (warehouse: string) => void;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  onNewDeliveryClick: () => void;
}

export const DeliveryFilterBar: React.FC<DeliveryFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedWarehouse,
  onWarehouseChange,
  viewMode,
  onViewModeChange,
  onNewDeliveryClick,
}) => {
  const isReadyFilterActive = selectedStatus === 'Ready';

  return (
    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-md border border-outline-variant/30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
      {/* Left: Search and Filters */}
      <div className="flex flex-wrap items-center gap-space-sm flex-1">
        {/* Search input with clear button */}
        <div className="relative flex-1 min-w-[260px] max-w-lg">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reference, customer, destination..."
            className="w-full pl-9 pr-8 py-1.5 bg-surface-container-low text-on-surface rounded-lg font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(79,70,229,0.3)] transition-all border border-transparent focus:border-primary"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-base">cancel</span>
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          type="button"
          onClick={() => {
            // Quick toggle for status filter
            onStatusChange(selectedStatus === 'Ready' ? 'All' : 'Ready');
          }}
          className={`inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-lg font-body-md text-body-md transition-colors border ${
            selectedStatus !== 'All'
              ? 'bg-primary-container text-on-primary border-primary-container'
              : 'bg-surface-container-low text-on-surface border-transparent hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Filters</span>
          {selectedStatus !== 'All' && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-primary text-[10px] font-bold">
              1
            </span>
          )}
        </button>

        {/* Active Filter Chips */}
        {isReadyFilterActive && (
          <div className="inline-flex items-center gap-1.5 px-space-sm py-1 bg-tertiary-fixed/30 text-tertiary rounded-full font-label-caps text-label-caps">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            <span>Ready Only</span>
            <button
              type="button"
              onClick={() => onStatusChange('All')}
              className="text-tertiary hover:opacity-70 flex items-center"
              aria-label="Remove Ready filter"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}

        {selectedWarehouse !== 'All' && (
          <div className="inline-flex items-center gap-1.5 px-space-sm py-1 bg-surface-container text-on-surface-variant rounded-full font-label-caps text-label-caps">
            <span>Warehouse: {selectedWarehouse}</span>
            <button
              type="button"
              onClick={() => onWarehouseChange('All')}
              className="text-outline hover:text-on-surface flex items-center"
              aria-label="Remove Warehouse filter"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: + New button, View switchers */}
      <div className="flex items-center gap-space-sm justify-between lg:justify-end">
        <button
          type="button"
          onClick={onNewDeliveryClick}
          className="lg:hidden h-9 px-3 flex items-center gap-1 rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New</span>
        </button>

        <div className="p-0.5 bg-surface-container-low rounded-lg flex items-center border border-outline-variant/20">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded transition-all ${
              viewMode === 'table'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
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
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Grid / Card View"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
        </div>
      </div>
    </div>
  );
};
