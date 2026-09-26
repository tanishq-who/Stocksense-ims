import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';
import { StateInspector, UiState } from '../components/common/StateInspector';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { WarehouseList } from '../components/settings/WarehouseList';
import { LocationList } from '../components/settings/LocationList';
import { WarehouseModal } from '../components/settings/WarehouseModal';
import { LocationModal } from '../components/settings/LocationModal';
import { UnsupportedSettingsNotice } from '../components/settings/UnsupportedSettingsNotice';
import { warehouseService } from '../api/warehouseService';
import { WarehouseItem, LocationItem } from '../types/warehouse';

type SettingsTab = 'warehouses' | 'locations' | 'preferences' | 'notifications';

export const SettingsPage: React.FC = () => {
  const [uiState, setUiState] = useState<UiState>('live');
  const [activeTab, setActiveTab] = useState<SettingsTab>('warehouses');

  // Real Backend Data
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  // Modals state
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [defaultWarehouseIdForLocation, setDefaultWarehouseIdForLocation] = useState<number | undefined>(undefined);

  // Filter state for Locations tab
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<number | undefined>(undefined);

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load Real Data from FastAPI
  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [whs, locs] = await Promise.all([
        warehouseService.getWarehouses(),
        warehouseService.getLocations(),
      ]);
      setWarehouses(whs);
      setLocations(locs);
      setUiState((prev) => (prev === 'loading' || prev === 'error' ? 'live' : prev));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to FastAPI settings endpoints.';
      setErrorMessage(msg);
      setUiState('error');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for Warehouse Modals
  const handleOpenAddWarehouse = () => {
    setEditingWarehouse(null);
    setIsWarehouseModalOpen(true);
  };

  const handleOpenEditWarehouse = (wh: WarehouseItem) => {
    setEditingWarehouse(wh);
    setIsWarehouseModalOpen(true);
  };

  const handleWarehouseSaved = (saved: WarehouseItem) => {
    const isEdit = Boolean(editingWarehouse);
    setToastMessage({
      type: 'success',
      text: isEdit
        ? `Warehouse '${saved.name}' updated successfully!`
        : `Warehouse '${saved.name}' created successfully with code ${saved.code}!`,
    });
    loadData();
  };

  // Handlers for Location Modals
  const handleOpenAddLocation = (preselectedWhId?: number) => {
    setEditingLocation(null);
    setDefaultWarehouseIdForLocation(preselectedWhId || selectedWarehouseFilter || warehouses[0]?.id);
    setIsLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: LocationItem) => {
    setEditingLocation(loc);
    setDefaultWarehouseIdForLocation(loc.warehouse_id);
    setIsLocationModalOpen(true);
  };

  const handleLocationSaved = (saved: LocationItem) => {
    const isEdit = Boolean(editingLocation);
    setToastMessage({
      type: 'success',
      text: isEdit
        ? `Location '${saved.name}' updated successfully!`
        : `Location '${saved.name}' created successfully!`,
    });
    loadData();
  };

  const handleViewLocationsForWarehouse = (whId: number) => {
    setSelectedWarehouseFilter(whId);
    setActiveTab('locations');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-margin py-space-md">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-body-md animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-primary-fixed text-on-primary-fixed border-outline-variant/30'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toastMessage.type === 'success'
              ? 'check_circle'
              : toastMessage.type === 'error'
              ? 'error'
              : 'info'}
          </span>
          <span className="font-medium">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Breadcrumbs Navigation */}
      <Breadcrumbs currentSection="Configuration" currentPageTitle="System Settings" />

      {/* Overview Banner */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 mb-space-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              System Settings & Warehouse Topology
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Manage physical distribution centers, bays, and operational routing zones backed by SQLite persistence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-outline-variant/20">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-body-sm text-on-surface font-mono text-[11px] border border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>TOPOLOGY: {warehouses.length} FACILITIES / {locations.length} ZONES</span>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 mb-space-lg overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('warehouses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-body-md transition-all whitespace-nowrap border-b-2 -mb-[1px] ${
            activeTab === 'warehouses'
              ? 'border-primary text-primary bg-surface-container-low'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">warehouse</span>
          <span>Warehouses</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-mono">
            {warehouses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-body-md transition-all whitespace-nowrap border-b-2 -mb-[1px] ${
            activeTab === 'locations'
              ? 'border-primary text-primary bg-surface-container-low'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">shelves</span>
          <span>Storage Locations</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-mono">
            {locations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-body-md transition-all whitespace-nowrap border-b-2 -mb-[1px] ${
            activeTab === 'preferences'
              ? 'border-primary text-primary bg-surface-container-low'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Inventory Preferences</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
            Planned
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-body-md transition-all whitespace-nowrap border-b-2 -mb-[1px] ${
            activeTab === 'notifications'
              ? 'border-primary text-primary bg-surface-container-low'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          <span>Notifications & Alerts</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
            Planned
          </span>
        </button>
      </div>

      {/* Main Tab Content based on UI State */}
      {uiState === 'loading' ? (
        <LoadingState />
      ) : uiState === 'error' ? (
        <ErrorState
          title="Facility Settings Sync Failure"
          message={errorMessage || 'Unable to retrieve warehouse and location data from FastAPI.'}
          onRetry={loadData}
        />
      ) : (
        <div>
          {activeTab === 'warehouses' && (
            <WarehouseList
              warehouses={warehouses}
              onAddWarehouse={handleOpenAddWarehouse}
              onEditWarehouse={handleOpenEditWarehouse}
              onViewLocations={handleViewLocationsForWarehouse}
            />
          )}

          {activeTab === 'locations' && (
            <LocationList
              locations={locations}
              warehouses={warehouses}
              selectedWarehouseFilter={selectedWarehouseFilter}
              onWarehouseFilterChange={setSelectedWarehouseFilter}
              onAddLocation={() => handleOpenAddLocation()}
              onEditLocation={handleOpenEditLocation}
            />
          )}

          {activeTab === 'preferences' && (
            <UnsupportedSettingsNotice
              title="Inventory Preferences Configuration"
              category="preferences"
            />
          )}

          {activeTab === 'notifications' && (
            <UnsupportedSettingsNotice
              title="Notification Routing & Threshold Alerts"
              category="notifications"
            />
          )}
        </div>
      )}

      {/* Warehouse Modal (Add / Edit) */}
      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        warehouse={editingWarehouse}
        onSaved={handleWarehouseSaved}
      />

      {/* Location Modal (Add / Edit) */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        location={editingLocation}
        warehouses={warehouses}
        defaultWarehouseId={defaultWarehouseIdForLocation}
        onSaved={handleLocationSaved}
      />

      {/* State Inspector */}
      <StateInspector currentState={uiState} onStateChange={setUiState} />
    </div>
  );
};
