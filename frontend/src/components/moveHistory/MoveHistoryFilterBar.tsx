import React from 'react';
import { BackendLocation } from '../../types/delivery';
import { BackendWarehouse } from '../../api/moveHistoryService';

interface MoveHistoryFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedLocationId?: number;
  onLocationChange: (locId?: number) => void;
  selectedDateRange: string;
  onDateRangeChange: (range: string) => void;
  locations: BackendLocation[];
  warehouses: BackendWarehouse[];
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  totalFilteredCount: number;
}

export const MoveHistoryFilterBar: React.FC<MoveHistoryFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedLocationId,
  onLocationChange,
  selectedDateRange,
  onDateRangeChange,
  locations,
  warehouses,
  onResetFilters,
  hasActiveFilters,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
}) => {
  const warehouseMap = new Map<number, string>();
  warehouses.forEach((w) => warehouseMap.set(w.id, w.name));

  const movementTypes = [
    { id: 'all', label: 'All Moves', icon: 'list_alt' },
    { id: 'receipt', label: 'Receipts', icon: 'call_received' },
    { id: 'delivery', label: 'Deliveries', icon: 'local_shipping' },
    { id: 'transfer', label: 'Transfers', icon: 'swap_horiz' },
    { id: 'adjustment', label: 'Adjustments', icon: 'tune' },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 mb-space-lg space-y-3">
      {/* Top Row: Search, Location, Date Range, View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <span className="material-symbols-outlined text-[20px] text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by reference (REC-, DEL-), product, SKU, or audit reason..."
            className="w-full pl-10 pr-9 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Location Dropdown Filter */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedLocationId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onLocationChange(val ? Number(val) : undefined);
            }}
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all pr-8 cursor-pointer"
          >
            <option value="">All Facilities & Locations</option>
            {locations.map((loc) => {
              const whName = loc.warehouse_id ? warehouseMap.get(loc.warehouse_id) : undefined;
              const label = whName ? `${whName} - ${loc.name}` : loc.name;
              return (
                <option key={loc.id} value={loc.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Date Range Selector */}
        <div className="relative min-w-[150px]">
          <select
            value={selectedDateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all pr-8 cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Table View"
            className={`p-1.5 rounded flex items-center justify-center transition-colors ${
              viewMode === 'table'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">table_rows</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('card')}
            title="Card View"
            className={`p-1.5 rounded flex items-center justify-center transition-colors ${
              viewMode === 'card'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Movement Type Chips & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mr-1">
            Movement Type:
          </span>
          {movementTypes.map((type) => {
            const isActive = selectedType.toLowerCase() === type.id.toLowerCase();
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onTypeChange(type.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-body-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{type.icon}</span>
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-body-sm text-on-surface-variant font-mono">
            Showing <strong className="text-on-surface">{totalFilteredCount}</strong> movements
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-body-sm text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
