import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CreateDeliveryInput, DeliveryStatus, BackendLocation, BackendProduct } from '../../types/delivery';
import { deliveryService } from '../../api/deliveryService';

interface NewDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeliveryInput) => Promise<void> | void;
}

interface ProductLineItem {
  id: string;
  productId?: number;
  productName: string;
  quantity: number;
  unit: string;
}

export const NewDeliveryModal: React.FC<NewDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [locations, setLocations] = useState<BackendLocation[]>([]);
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(undefined);
  const [fromLocation, setFromLocation] = useState('Main Warehouse');
  const [toDestination, setToDestination] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Delivery Courier');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [items, setItems] = useState<ProductLineItem[]>([
    { id: '1', productName: '', quantity: 1, unit: 'Units' },
  ]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      deliveryService.getLocations().then((locs) => {
        if (locs && locs.length > 0) {
          setLocations(locs);
          setSelectedLocationId(locs[0].id);
          setFromLocation(locs[0].name);
        }
      });
      deliveryService.getProducts().then((prods) => {
        if (prods && prods.length > 0) {
          setProducts(prods);
        }
      });
    }
  }, [isOpen]);

  const resetForm = () => {
    if (locations.length > 0) {
      setFromLocation(locations[0].name);
      setSelectedLocationId(locations[0].id);
    } else {
      setFromLocation('Main Warehouse');
      setSelectedLocationId(undefined);
    }
    setToDestination('');
    setContactName('');
    setContactRole('Delivery Courier');
    const today = new Date();
    setScheduledDate(today.toISOString().split('T')[0]);
    setItems([{ id: '1', productName: '', quantity: 1, unit: 'Units' }]);
    setNotes('');
    setErrors({});
  };


  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddProductLine = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), productName: '', quantity: 1, unit: 'Units' },
    ]);
  };

  const handleRemoveProductLine = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProductChange = (
    id: string,
    field: 'productName' | 'quantity' | 'unit',
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    // Clear product error on change
    if (errors[`product_${id}`] || errors[`qty_${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`product_${id}`];
        delete next[`qty_${id}`];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fromLocation.trim()) {
      newErrors.fromLocation = 'Source warehouse is required';
    }
    if (!toDestination.trim()) {
      newErrors.toDestination = 'Destination / Customer location is required';
    }
    if (!contactName.trim()) {
      newErrors.contactName = 'Contact / Handler name is required';
    }
    if (!scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    if (items.length === 0) {
      newErrors.general = 'At least one product line is required';
    }

    items.forEach((item, idx) => {
      if (!item.productName.trim()) {
        newErrors[`product_${item.id}`] = `Product name on line ${idx + 1} is required`;
      }
      if (item.quantity <= 0 || isNaN(item.quantity)) {
        newErrors[`qty_${item.id}`] = `Quantity on line ${idx + 1} must be greater than zero`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: DeliveryStatus) => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        fromLocation,
        toDestination,
        contactName,
        contactRole,
        scheduledDate,
        sourceLocationId: selectedLocationId || locations[0]?.id || 1,
        items: items.map((it) => {
          const matchedProd = products.find(
            (p) =>
              p.name.toLowerCase() === it.productName.trim().toLowerCase() ||
              p.sku.toLowerCase() === it.productName.trim().toLowerCase()
          );
          return {
            productId: matchedProd ? matchedProd.id : (it.productId || 1),
            productName: it.productName.trim(),
            sku: matchedProd?.sku,
            quantity: Number(it.quantity),
            unit: it.unit,
          };
        }),
        notes: notes.trim() || undefined,
        status,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Delivery"
      subtitle="Schedule outgoing freight manifest, dispatch route, and line items."
      maxWidth="max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit('Ready');
        }}
        className="space-y-space-md"
      >
        {/* Source & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          <div>
            <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold mb-1">
              From Location / Warehouse <span className="text-error">*</span>
            </label>
            <select
              value={selectedLocationId !== undefined ? String(selectedLocationId) : fromLocation}
              onChange={(e) => {
                const locId = Number(e.target.value);
                const foundLoc = locations.find((l) => l.id === locId);
                if (foundLoc) {
                  setSelectedLocationId(foundLoc.id);
                  setFromLocation(foundLoc.name);
                } else {
                  setFromLocation(e.target.value);
                }
                if (errors.fromLocation) setErrors((prev) => ({ ...prev, fromLocation: '' }));
              }}
              className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest"
            >
              {locations.length > 0 ? (
                locations.map((loc) => (
                  <option key={loc.id} value={String(loc.id)}>
                    {loc.name} {loc.code ? `(${loc.code})` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="Warehouse 2">Warehouse 2</option>
                  <option value="Central Depot">Central Depot</option>
                  <option value="Cold Storage Hub">Cold Storage Hub</option>
                </>
              )}
            </select>
            {errors.fromLocation && (
              <p className="font-body-sm text-body-sm text-error mt-1">{errors.fromLocation}</p>
            )}
          </div>


          <div>
            <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold mb-1">
              Destination / Customer <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. West Retail Store, Client Site B"
              value={toDestination}
              onChange={(e) => {
                setToDestination(e.target.value);
                if (errors.toDestination) setErrors((prev) => ({ ...prev, toDestination: '' }));
              }}
              className={`w-full h-10 px-3 bg-surface-container-low border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest ${
                errors.toDestination ? 'border-error' : 'border-outline-variant/40'
              }`}
            />
            {errors.toDestination && (
              <p className="font-body-sm text-body-sm text-error mt-1">{errors.toDestination}</p>
            )}
          </div>
        </div>

        {/* Contact & Scheduled Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          <div>
            <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold mb-1">
              Contact / Handler Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ravi Kumar"
              value={contactName}
              onChange={(e) => {
                setContactName(e.target.value);
                if (errors.contactName) setErrors((prev) => ({ ...prev, contactName: '' }));
              }}
              className={`w-full h-10 px-3 bg-surface-container-low border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest ${
                errors.contactName ? 'border-error' : 'border-outline-variant/40'
              }`}
            />
            {errors.contactName && (
              <p className="font-body-sm text-body-sm text-error mt-1">{errors.contactName}</p>
            )}
          </div>

          <div>
            <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold mb-1">
              Scheduled Date <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => {
                setScheduledDate(e.target.value);
                if (errors.scheduledDate) setErrors((prev) => ({ ...prev, scheduledDate: '' }));
              }}
              className={`w-full h-10 px-3 bg-surface-container-low border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest font-mono ${
                errors.scheduledDate ? 'border-error' : 'border-outline-variant/40'
              }`}
            />
            {errors.scheduledDate && (
              <p className="font-body-sm text-body-sm text-error mt-1">{errors.scheduledDate}</p>
            )}
          </div>
        </div>

        {/* Product Lines Section */}
        <div className="pt-space-xs">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
              Product Manifest Lines <span className="text-error">*</span>
            </span>
            <button
              type="button"
              onClick={handleAddProductLine}
              className="inline-flex items-center gap-1 text-primary hover:text-primary-container text-body-sm font-body-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Add Line</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg border border-outline-variant/20"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    list="available-products"
                    placeholder={`Product name / SKU #${idx + 1}`}
                    value={item.productName}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleProductChange(item.id, 'productName', val);
                      const matched = products.find(
                        (p) =>
                          p.name.toLowerCase() === val.toLowerCase() ||
                          p.sku.toLowerCase() === val.toLowerCase()
                      );
                      if (matched) {
                        handleProductChange(item.id, 'unit', matched.unit_of_measure || 'Units');
                      }
                    }}
                    className={`w-full h-9 px-2.5 bg-surface-container-lowest border rounded font-body-md text-body-md focus:outline-none focus:border-primary ${
                      errors[`product_${item.id}`] ? 'border-error' : 'border-outline-variant/40'
                    }`}
                  />
                  {errors[`product_${item.id}`] && (
                    <p className="font-body-sm text-xs text-error mt-0.5">
                      {errors[`product_${item.id}`]}
                    </p>
                  )}
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity || ''}
                    onChange={(e) =>
                      handleProductChange(item.id, 'quantity', parseInt(e.target.value, 10) || 0)
                    }
                    className={`w-full h-9 px-2.5 bg-surface-container-lowest border rounded font-body-md text-body-md focus:outline-none focus:border-primary font-mono text-center ${
                      errors[`qty_${item.id}`] ? 'border-error' : 'border-outline-variant/40'
                    }`}
                  />
                  {errors[`qty_${item.id}`] && (
                    <p className="font-body-sm text-xs text-error mt-0.5">
                      {errors[`qty_${item.id}`]}
                    </p>
                  )}
                </div>

                <div className="w-24">
                  <select
                    value={item.unit}
                    onChange={(e) => handleProductChange(item.id, 'unit', e.target.value)}
                    className="w-full h-9 px-2 bg-surface-container-lowest border border-outline-variant/40 rounded font-body-sm text-body-sm focus:outline-none focus:border-primary"
                  >
                    <option value="Units">Units</option>
                    <option value="Kits">Kits</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Packs">Packs</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Pallets">Pallets</option>
                  </select>
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProductLine(item.id)}
                    className="p-1 text-on-surface-variant hover:text-error transition-colors rounded"
                    title="Remove line"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Datalist for available products */}
          <datalist id="available-products">
            {products.map((p) => (
              <option key={p.id} value={p.name}>
                {p.sku} ({p.unit_of_measure})
              </option>
            ))}
          </datalist>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold mb-1">
            Dispatch Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Special loading instructions, dock gates, driver notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest resize-none"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-md border-t border-outline-variant/20">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('Draft')}
              className="px-space-md py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md hover:bg-surface-container-low transition-colors shadow-sm font-medium"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm shadow-sm hover:opacity-95 transition-opacity font-semibold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Create Delivery</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
