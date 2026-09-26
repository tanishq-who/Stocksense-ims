import React from 'react';
import { BackendLocation } from '../../types/delivery';

interface ReceiptFilterBarProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedLocationId: number | undefined;
  onLocationChange: (locId: number | undefined) => void;
  locations: BackendLocation[];
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  onRefresh: () => void;
  onClearFilters: () => void;
}

export const ReceiptFilterBar: React.FC<ReceiptFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedLocationId,
  onLocationChange,
  locations,
  viewMode,
  onViewModeChange,
  onRefresh,
  onClearFilters,
}) => {
  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'draft', label: 'Draft' },
    { id: 'waiting', label: 'Waiting' },
    { id: 'ready', label: 'Ready' },
    { id: 'done', label: 'Done' },
  ];

  let activeFiltersCount = 0;
  if (searchTerm.trim()) activeFiltersCount++;
  if (selectedStatus !== 'all') activeFiltersCount++;
  if (selectedLocationId !== undefined) activeFiltersCount++;

  return (
    <div className="w-full bg-surface-container-lowest p-space-md rounded-t-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/20 border-b-0">
      {/* Search & Location Filter */}
      <div className="flex flex-1 flex-wrap items-center gap-space-sm">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reference, supplier, PO..."
            className="w-full pl-9 pr-space-md py-1.5 rounded-lg bg-surface font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-outline-variant/20"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            aria-label="Filter by Status"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-outline-variant/20"
          >
            {statusOptions.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
            expand_more
          </span>
        </div>

        {/* Destination Location Dropdown */}
        <div className="relative">
          <select
            aria-label="Filter by Destination Location"
            value={selectedLocationId !== undefined ? String(selectedLocationId) : 'all'}
            onChange={(e) => {
              const val = e.target.value;
              onLocationChange(val === 'all' ? undefined : Number(val));
            }}
            className="h-9 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-outline-variant/20 max-w-[200px] truncate"
          >
            <option value="all">All Receiving Bays</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
            expand_more
          </span>
        </div>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-primary font-body-sm text-body-sm hover:underline font-medium ml-1"
          >
            Clear filters ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Table / Grid Mode & Refresh */}
      <div className="flex items-center gap-space-sm self-end md:self-auto">
        <div className="flex items-center bg-surface p-0.5 rounded-lg border border-outline-variant/20">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1 rounded-md transition-all ${
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
            className={`p-1 rounded-md transition-all ${
              viewMode === 'card'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Grid View"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-surface text-on-surface-variant hover:text-on-surface hover:bg-surface-container shadow-sm border border-outline-variant/20 transition-colors"
          title="Refresh Receipts"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>
    </div>
  );
};
