import React, { useState, useMemo } from 'react';
import { WarehouseItem } from '../../types/warehouse';

interface WarehouseListProps {
  warehouses: WarehouseItem[];
  onAddWarehouse: () => void;
  onEditWarehouse: (warehouse: WarehouseItem) => void;
  onViewLocations: (warehouseId: number) => void;
}

export const WarehouseList: React.FC<WarehouseListProps> = ({
  warehouses,
  onAddWarehouse,
  onEditWarehouse,
  onViewLocations,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWarehouses = useMemo(() => {
    if (!searchTerm.trim()) return warehouses;
    const q = searchTerm.toLowerCase();
    return warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        (w.address && w.address.toLowerCase().includes(q))
    );
  }, [warehouses, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[22px]">warehouse</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Warehouse Nodes & Facilities
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Centralized storage hubs, regional fulfillment centers, and depot configurations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddWarehouse}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-medium text-body-md shadow-sm hover:opacity-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Warehouse</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search warehouses by name, code, or address..."
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

        <div className="text-body-sm text-on-surface-variant font-mono">
          Total: <strong className="text-on-surface">{filteredWarehouses.length}</strong> facilities
        </div>
      </div>

      {/* Warehouse Table */}
      {filteredWarehouses.length === 0 ? (
        <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-[36px] text-outline mb-2">warehouse</span>
          <h4 className="font-semibold text-on-surface text-body-lg">No Warehouses Found</h4>
          <p className="text-body-md text-on-surface-variant mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No warehouse nodes match your active search query.'
              : 'No warehouse facilities registered in the database yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider h-10 select-none border-b border-outline-variant/20">
                  <th className="px-4 py-2 font-semibold">Facility Name</th>
                  <th className="px-4 py-2 font-semibold">Node Code</th>
                  <th className="px-4 py-2 font-semibold">Physical Address</th>
                  <th className="px-4 py-2 font-semibold">Bays & Zones</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-body-md text-body-md text-on-surface">
                {filteredWarehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-surface-container-low/60 transition-colors">
                    {/* Facility Name */}
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                        <span>{wh.name}</span>
                      </div>
                    </td>

                    {/* Node Code */}
                    <td className="px-4 py-3 font-mono text-label-code text-primary font-semibold">
                      {wh.code}
                    </td>

                    {/* Address */}
                    <td className="px-4 py-3 text-on-surface-variant max-w-[220px] truncate" title={wh.address || '—'}>
                      {wh.address || '—'}
                    </td>

                    {/* Locations count & link */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onViewLocations(wh.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[11px] font-semibold hover:bg-surface-container-high transition-colors"
                        title="Click to view locations inside this warehouse"
                      >
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        <span>{wh.locations_count ?? 0} locations</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {wh.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 text-[11px] font-label-caps font-semibold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container border border-outline-variant text-outline px-2.5 py-0.5 text-[11px] font-label-caps font-semibold uppercase tracking-wider">
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Edit Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onEditWarehouse(wh)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-body-sm text-primary hover:bg-surface-container transition-colors font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
