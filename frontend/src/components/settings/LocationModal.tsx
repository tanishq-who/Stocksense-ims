import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { LocationItem, LocationCreateInput, LocationUpdateInput, WarehouseItem } from '../../types/warehouse';
import { warehouseService } from '../../api/warehouseService';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationItem | null; // null = create, object = edit
  warehouses: WarehouseItem[];
  defaultWarehouseId?: number;
  onSaved: (savedLocation: LocationItem) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  location,
  warehouses,
  defaultWarehouseId,
  onSaved,
}) => {
  const isEdit = Boolean(location);

  const [warehouseId, setWarehouseId] = useState<number>(defaultWarehouseId || warehouses[0]?.id || 1);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [locationType, setLocationType] = useState('internal');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      setWarehouseId(location.warehouse_id);
      setName(location.name);
      setCode(location.code || '');
      setLocationType(location.location_type || 'internal');
    } else {
      setWarehouseId(defaultWarehouseId || warehouses[0]?.id || 1);
      setName('');
      setCode('');
      setLocationType('internal');
    }
    setErrorMessage(null);
  }, [location, isOpen, defaultWarehouseId, warehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Location name is required.');
      return;
    }
    if (!warehouseId) {
      setErrorMessage('Please select a parent warehouse.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      let result: LocationItem;
      if (isEdit && location) {
        const updateInput: LocationUpdateInput = {
          warehouse_id: warehouseId,
          name: name.trim(),
          code: code.trim() || undefined,
          location_type: locationType,
        };
        result = await warehouseService.updateLocation(location.id, updateInput);
      } else {
        const createInput: LocationCreateInput = {
          warehouse_id: warehouseId,
          name: name.trim(),
          code: code.trim() || undefined,
          location_type: locationType,
        };
        result = await warehouseService.createLocation(createInput);
      }

      onSaved(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save location.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Location: ${location?.name}` : 'Create New Storage Location'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-body-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Parent Warehouse Selection */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1">
            Parent Warehouse <span className="text-error">*</span>
          </label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(Number(e.target.value))}
            required
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-on-surface-variant mt-1">
            Location must belong to an existing active facility node.
          </p>
        </div>

        {/* Location Name */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1">
            Location Name / Zone <span className="text-error">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aisle 1 - Shelf B or High-Bay Rack 04"
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[11px] text-on-surface-variant mt-1">
            Must be unique within the selected warehouse.
          </p>
        </div>

        {/* Location Code */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1">
            Identifier Code <span className="text-outline font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. LOC-A1-S1 (leave blank to auto-generate)"
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface font-mono border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Location Type */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1">
            Zone / Location Type
          </label>
          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="internal">Internal General Storage</option>
            <option value="storage">Long-Term Storage Bay</option>
            <option value="receiving">Inbound Receiving Dock</option>
            <option value="dispatch">Outbound Staging & Dispatch</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-body-md font-medium hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-body-md font-medium shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            {isSubmitting && (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            )}
            <span>{isEdit ? 'Save Changes' : 'Create Location'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
