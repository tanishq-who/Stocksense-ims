import React, { useState, useMemo } from 'react';
import { LocationItem, WarehouseItem } from '../../types/warehouse';

interface LocationListProps {
  locations: LocationItem[];
  warehouses: WarehouseItem[];
  selectedWarehouseFilter?: number;
  onWarehouseFilterChange: (whId?: number) => void;
  onAddLocation: () => void;
  onEditLocation: (location: LocationItem) => void;
}

export const LocationList: React.FC<LocationListProps> = ({
  locations,
  warehouses,
  selectedWarehouseFilter,
  onWarehouseFilterChange,
  onAddLocation,
  onEditLocation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const warehouseMap = useMemo(() => {
    const map = new Map<number, WarehouseItem>();
    warehouses.forEach((w) => map.set(w.id, w));
    return map;
  }, [warehouses]);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // 1. Warehouse filter
      if (selectedWarehouseFilter !== undefined && loc.warehouse_id !== selectedWarehouseFilter) {
        return false;
      }

      // 2. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = loc.name.toLowerCase().includes(q);
        const matchesCode = loc.code ? loc.code.toLowerCase().includes(q) : false;
        const wh = warehouseMap.get(loc.warehouse_id);
        const matchesWh = wh ? wh.name.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCode && !matchesWh) return false;
      }

      return true;
    });
  }, [locations, selectedWarehouseFilter, searchTerm, warehouseMap]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-[22px]">shelves</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Storage Locations & Stock Zones
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Aisles, racks, bays, and docks associated with specific warehouse facilities.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddLocation}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-medium text-body-md shadow-sm hover:opacity-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Location</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by zone, aisle, code..."
              className="w-full pl-9 pr-8 py-1.5 bg-surface-container-low rounded-lg text-body-md text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Warehouse Selector */}
          <div className="min-w-[200px]">
            <select
              value={selectedWarehouseFilter ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onWarehouseFilterChange(val ? Number(val) : undefined);
              }}
              className="w-full px-3 py-1.5 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="">All Facilities ({warehouses.length})</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-body-sm text-on-surface-variant font-mono self-end sm:self-auto">
          Showing <strong className="text-on-surface">{filteredLocations.length}</strong> of{' '}
          {locations.length} locations
        </div>
      </div>

      {/* Locations Table */}
      {filteredLocations.length === 0 ? (
        <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-[36px] text-outline mb-2">shelves</span>
          <h4 className="font-semibold text-on-surface text-body-lg">No Locations Found</h4>
          <p className="text-body-md text-on-surface-variant mt-1 max-w-sm mx-auto">
            {searchTerm || selectedWarehouseFilter !== undefined
              ? 'No storage locations match your active filter criteria.'
              : 'No storage locations registered in this facility yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider h-10 select-none border-b border-outline-variant/20">
                  <th className="px-4 py-2 font-semibold">Location / Zone</th>
                  <th className="px-4 py-2 font-semibold">Zone Code</th>
                  <th className="px-4 py-2 font-semibold">Parent Facility</th>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-4 py-2 font-semibold">Stock on Hand</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-body-md text-body-md text-on-surface">
                {filteredLocations.map((loc) => {
                  const parentWh = warehouseMap.get(loc.warehouse_id);

                  return (
                    <tr key={loc.id} className="hover:bg-surface-container-low/60 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3 font-semibold text-on-surface">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-primary">
                            location_on
                          </span>
                          <span>{loc.name}</span>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3 font-mono text-label-code text-on-surface-variant">
                        {loc.code || '—'}
                      </td>

                      {/* Parent Facility */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-body-sm font-medium border border-outline-variant/30">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span>{parentWh ? parentWh.name : `Warehouse #${loc.warehouse_id}`}</span>
                        </span>
                      </td>

                      {/* Location Type */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant text-[11px] font-mono capitalize">
                          {loc.location_type || 'internal'}
                        </span>
                      </td>

                      {/* Stock Summary */}
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface text-[13px]">
                            {loc.total_quantity?.toFixed(0) ?? 0} units
                          </span>
                          <span className="text-[11px] text-outline font-normal">
                            ({loc.products_in_stock_count ?? 0} products)
                          </span>
                        </div>
                      </td>

                      {/* Edit Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onEditLocation(loc)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-body-sm text-primary hover:bg-surface-container transition-colors font-medium"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
