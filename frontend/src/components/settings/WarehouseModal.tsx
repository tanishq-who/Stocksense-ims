import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { WarehouseItem, WarehouseCreateInput, WarehouseUpdateInput } from '../../types/warehouse';
import { warehouseService } from '../../api/warehouseService';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse: WarehouseItem | null; // null = create, object = edit
  onSaved: (savedWarehouse: WarehouseItem) => void;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  warehouse,
  onSaved,
}) => {
  const isEdit = Boolean(warehouse);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name);
      setCode(warehouse.code || '');
      setAddress(warehouse.address || '');
      setIsActive(warehouse.is_active);
    } else {
      setName('');
      setCode('');
      setAddress('');
      setIsActive(true);
    }
    setErrorMessage(null);
  }, [warehouse, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Warehouse name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      let result: WarehouseItem;
      if (isEdit && warehouse) {
        const updateInput: WarehouseUpdateInput = {
          name: name.trim(),
          code: code.trim() || undefined,
          address: address.trim() || undefined,
          is_active: isActive,
        };
        result = await warehouseService.updateWarehouse(warehouse.id, updateInput);
      } else {
        const createInput: WarehouseCreateInput = {
          name: name.trim(),
          code: code.trim() || undefined,
          address: address.trim() || undefined,
          is_active: isActive,
        };
        result = await warehouseService.createWarehouse(createInput);
      }

      onSaved(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save warehouse.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Warehouse: ${warehouse?.name}` : 'Create New Warehouse'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-body-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Warehouse Name */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1">
            Warehouse Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Central Distribution Center"
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[11px] text-on-surface-variant mt-1">
            Must be unique across all facility nodes.
          </p>
        </div>

        {/* Warehouse Code */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1">
            Identifier Code <span className="text-outline font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. WH-CENTRAL (leave blank to auto-generate)"
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface font-mono border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1">
            Physical Address <span className="text-outline font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Gate 4, Logistics Park North, Bay 12"
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="is_active_toggle"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
          />
          <label htmlFor="is_active_toggle" className="text-body-sm font-medium text-on-surface cursor-pointer">
            Facility is active and accepting inventory movements
          </label>
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
            <span>{isEdit ? 'Save Changes' : 'Create Warehouse'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
