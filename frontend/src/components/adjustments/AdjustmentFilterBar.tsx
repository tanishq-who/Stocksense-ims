import React from 'react';
import { BackendLocation } from '../../types/delivery';

interface AdjustmentFilterBarProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedLocationId: number | undefined;
  onLocationChange: (locId: number | undefined) => void;
  selectedDiscrepancy: 'all' | 'positive' | 'negative' | 'neutral';
  onDiscrepancyChange: (type: 'all' | 'positive' | 'negative' | 'neutral') => void;
  locations: BackendLocation[];
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  onRefresh: () => void;
  onClearFilters: () => void;
}

export const AdjustmentFilterBar: React.FC<AdjustmentFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedLocationId,
  onLocationChange,
  selectedDiscrepancy,
  onDiscrepancyChange,
  locations,
  viewMode,
  onViewModeChange,
  onRefresh,
  onClearFilters,
}) => {
  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'draft', label: 'Draft / In Review' },
    { id: 'done', label: 'Done / Recorded' },
  ];

  const discrepancyOptions = [
    { id: 'all', label: 'All Variances' },
    { id: 'positive', label: 'Positive Variances (+)' },
    { id: 'negative', label: 'Negative Variances (-)' },
    { id: 'neutral', label: 'No Discrepancy (0)' },
  ];

  let activeFiltersCount = 0;
  if (searchTerm.trim()) activeFiltersCount++;
  if (selectedStatus !== 'all') activeFiltersCount++;
  if (selectedLocationId !== undefined) activeFiltersCount++;
  if (selectedDiscrepancy !== 'all') activeFiltersCount++;

  return (
    <div className="w-full bg-surface-container-lowest p-space-md rounded-t-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/20 border-b-0">
      {/* Search & Selectors */}
      <div className="flex flex-1 flex-wrap items-center gap-space-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reference, product, SKU, or bay..."
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

        {/* Location Dropdown */}
        <div className="relative">
          <select
            aria-label="Filter by Warehouse Location"
            value={selectedLocationId !== undefined ? String(selectedLocationId) : 'all'}
            onChange={(e) => {
              const val = e.target.value;
              onLocationChange(val === 'all' ? undefined : Number(val));
            }}
            className="h-9 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-outline-variant/20 max-w-[180px] truncate"
          >
            <option value="all">All Locations</option>
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

        {/* Variance Dropdown */}
        <div className="relative">
          <select
            aria-label="Filter by Discrepancy Type"
            value={selectedDiscrepancy}
            onChange={(e) =>
              onDiscrepancyChange(e.target.value as 'all' | 'positive' | 'negative' | 'neutral')
            }
            className="h-9 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-outline-variant/20 max-w-[180px] truncate"
          >
            {discrepancyOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
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
            className="font-body-sm text-body-sm text-primary hover:underline px-2 py-1 font-medium"
          >
            Clear filters ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* View Switcher and Refresh */}
      <div className="flex items-center gap-2 self-end md:self-auto">
        <div className="inline-flex rounded-lg bg-surface-container-low p-0.5 border border-outline-variant/20">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Table View"
            className={`p-1.5 rounded transition-all ${
              viewMode === 'table'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">table_rows</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('card')}
            title="Card Grid View"
            className={`p-1.5 rounded transition-all ${
              viewMode === 'card'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Refresh Adjustments"
          className="p-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-primary shadow-xs hover:shadow transition-all border border-outline-variant/20"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>
    </div>
  );
};
