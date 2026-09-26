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
  sku?: string;
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingLookups(true);
      setApiError(null);
      Promise.all([deliveryService.getLocations(), deliveryService.getProducts()])
        .then(([locs, prods]) => {
          if (locs && locs.length > 0) {
            setLocations(locs);
            setSelectedLocationId(locs[0].id);
            setFromLocation(locs[0].name);
          }
          if (prods && prods.length > 0) {
            setProducts(prods);
            // Default first line item to first product if not set
            setItems((prev) =>
              prev.map((it, idx) =>
                idx === 0 && !it.productId
                  ? {
                      ...it,
                      productId: prods[0].id,
                      productName: prods[0].name,
                      sku: prods[0].sku,
                      unit: prods[0].unit_of_measure,
                    }
                  : it
              )
            );
          }
        })
        .finally(() => {
          setIsLoadingLookups(false);
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
    if (products.length > 0) {
      setItems([
        {
          id: '1',
          productId: products[0].id,
          productName: products[0].name,
          sku: products[0].sku,
          quantity: 1,
          unit: products[0].unit_of_measure,
        },
      ]);
    } else {
      setItems([{ id: '1', productName: '', quantity: 1, unit: 'Units' }]);
    }
    setNotes('');
    setErrors({});
    setApiError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddProductLine = () => {
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        productId: firstProd?.id,
        productName: firstProd?.name || '',
        sku: firstProd?.sku,
        quantity: 1,
        unit: firstProd?.unit_of_measure || 'Units',
      },
    ]);
  };

  const handleRemoveProductLine = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProductSelect = (id: string, productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              unit: prod.unit_of_measure,
            }
          : item
      )
    );
    if (errors[`product_${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`product_${id}`];
        return next;
      });
    }
    setApiError(null);
  };

  const handleProductChange = (
    id: string,
    field: 'productName' | 'quantity' | 'unit',
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    if (errors[`product_${id}`] || errors[`qty_${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`product_${id}`];
        delete next[`qty_${id}`];
        return next;
      });
    }
    setApiError(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedLocationId && locations.length > 0) {
      newErrors.fromLocation = 'Source warehouse location is required';
    }
    if (!toDestination.trim() && !contactName.trim()) {
      newErrors.toDestination = 'Destination or Customer name is required';
    }
    if (!scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    if (items.length === 0) {
      newErrors.general = 'At least one product line is required';
    }

    items.forEach((item, idx) => {
      if (products.length > 0) {
        if (!item.productId) {
          newErrors[`product_${item.id}`] = `Please select a product for line ${idx + 1}`;
        }
      } else {
        if (!item.productName.trim()) {
          newErrors[`product_${item.id}`] = `Product name on line ${idx + 1} is required`;
        }
      }

      if (item.quantity <= 0 || isNaN(item.quantity)) {
        newErrors[`qty_${item.id}`] = `Quantity on line ${idx + 1} must be greater than zero`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: DeliveryStatus) => {
    setApiError(null);
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        fromLocation,
        toDestination: toDestination.trim(),
        contactName: contactName.trim(),
        contactRole: contactRole.trim(),
        scheduledDate,
        sourceLocationId: selectedLocationId || locations[0]?.id || 1,
        items: items.map((it) => {
          let resolvedProductId = it.productId;
          if (!resolvedProductId) {
            const matchedProd = products.find(
              (p) =>
                p.name.toLowerCase() === it.productName.trim().toLowerCase() ||
                p.sku.toLowerCase() === it.productName.trim().toLowerCase()
            );
            resolvedProductId = matchedProd ? matchedProd.id : 1;
          }
          return {
            productId: resolvedProductId,
            productName: it.productName.trim() || `Product #${resolvedProductId}`,
            sku: it.sku,
            quantity: Number(it.quantity),
            unit: it.unit,
          };
        }),
        notes: notes.trim() || undefined,
        status,
      });
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create delivery on backend.';
      setApiError(msg);
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
          handleSubmit('Draft');
        }}
        className="space-y-space-md"
      >
        {/* API Error Notification Banner */}
        {apiError && (
          <div className="p-3 bg-error-container/60 border border-error/40 text-on-error-container rounded-lg flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">error</span>
            <div className="text-body-sm font-body-sm flex-1">
              <span className="font-semibold text-error block">Backend API Error:</span>
              <span className="break-words">{apiError}</span>
            </div>
            <button
              type="button"
              onClick={() => setApiError(null)}
              className="text-on-error-container hover:text-error"
              title="Dismiss error"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Source & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          <div>
            <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold mb-1">
              From Location / Warehouse <span className="text-error">*</span>
            </label>
            <select
              value={selectedLocationId !== undefined ? String(selectedLocationId) : ''}
              disabled={isSubmitting || isLoadingLookups}
              onChange={(e) => {
                const locId = Number(e.target.value);
                const foundLoc = locations.find((l) => l.id === locId);
                if (foundLoc) {
                  setSelectedLocationId(foundLoc.id);
                  setFromLocation(foundLoc.name);
                }
                if (errors.fromLocation) setErrors((prev) => ({ ...prev, fromLocation: '' }));
              }}
              className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoadingLookups ? (
                <option value="">Loading locations from backend...</option>
              ) : locations.length > 0 ? (
                locations.map((loc) => (
                  <option key={loc.id} value={String(loc.id)}>
                    {loc.name} {loc.code ? `(${loc.code})` : ''}
                  </option>
                ))
              ) : (
                <option value="1">Main Warehouse (Location #1)</option>
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
              disabled={isSubmitting}
              onChange={(e) => {
                setToDestination(e.target.value);
                if (errors.toDestination) setErrors((prev) => ({ ...prev, toDestination: '' }));
              }}
              className={`w-full h-10 px-3 bg-surface-container-low border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest disabled:opacity-60 disabled:cursor-not-allowed ${
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
              disabled={isSubmitting}
              onChange={(e) => {
                setContactName(e.target.value);
                if (errors.contactName) setErrors((prev) => ({ ...prev, contactName: '' }));
              }}
              className={`w-full h-10 px-3 bg-surface-container-low border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest disabled:opacity-60 disabled:cursor-not-allowed ${
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
              disabled={isSubmitting}
              onChange={(e) => {
                setScheduledDate(e.target.value);
                if (errors.scheduledDate) setErrors((prev) => ({ ...prev, scheduledDate: '' }));
              }}
              className={`w-full h-10 px-3 bg-surface-container-low border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest font-mono disabled:opacity-60 disabled:cursor-not-allowed ${
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
              {products.length > 0 && (
                <span className="text-outline font-normal ml-1">({products.length} products in catalog)</span>
              )}
            </span>
            <button
              type="button"
              onClick={handleAddProductLine}
              disabled={isSubmitting || isLoadingLookups}
              className="inline-flex items-center gap-1 text-primary hover:text-primary-container text-body-sm font-body-sm font-semibold transition-colors disabled:opacity-50"
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
                {/* Product Selector */}
                <div className="flex-1">
                  {products.length > 0 ? (
                    <select
                      value={item.productId || ''}
                      disabled={isSubmitting}
                      onChange={(e) => handleProductSelect(item.id, Number(e.target.value))}
                      className={`w-full h-9 px-2.5 bg-surface-container-lowest border rounded font-body-md text-body-md focus:outline-none focus:border-primary disabled:opacity-60 ${
                        errors[`product_${item.id}`] ? 'border-error' : 'border-outline-variant/40'
                      }`}
                    >
                      <option value="">-- Select Product from Catalog --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      list="available-products"
                      disabled={isSubmitting}
                      placeholder={isLoadingLookups ? 'Loading products...' : `Product name / SKU #${idx + 1}`}
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
                      className={`w-full h-9 px-2.5 bg-surface-container-lowest border rounded font-body-md text-body-md focus:outline-none focus:border-primary disabled:opacity-60 ${
                        errors[`product_${item.id}`] ? 'border-error' : 'border-outline-variant/40'
                      }`}
                    />
                  )}
                  {errors[`product_${item.id}`] && (
                    <p className="font-body-sm text-xs text-error mt-0.5">
                      {errors[`product_${item.id}`]}
                    </p>
                  )}
                </div>

                {/* Quantity Input */}
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    disabled={isSubmitting}
                    placeholder="Qty"
                    value={item.quantity || ''}
                    onChange={(e) =>
                      handleProductChange(item.id, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    className={`w-full h-9 px-2.5 bg-surface-container-lowest border rounded font-body-md text-body-md focus:outline-none focus:border-primary font-mono text-center disabled:opacity-60 ${
                      errors[`qty_${item.id}`] ? 'border-error' : 'border-outline-variant/40'
                    }`}
                  />
                  {errors[`qty_${item.id}`] && (
                    <p className="font-body-sm text-xs text-error mt-0.5">
                      {errors[`qty_${item.id}`]}
                    </p>
                  )}
                </div>

                {/* Unit of Measure */}
                <div className="w-24">
                  {products.length > 0 ? (
                    <div className="w-full h-9 px-2 flex items-center justify-center bg-surface-container border border-outline-variant/40 rounded font-label-caps text-xs text-on-surface-variant font-semibold select-none">
                      {item.unit || 'Units'}
                    </div>
                  ) : (
                    <select
                      value={item.unit}
                      disabled={isSubmitting}
                      onChange={(e) => handleProductChange(item.id, 'unit', e.target.value)}
                      className="w-full h-9 px-2 bg-surface-container-lowest border border-outline-variant/40 rounded font-body-sm text-body-sm focus:outline-none focus:border-primary disabled:opacity-60"
                    >
                      <option value="Units">Units</option>
                      <option value="pcs">pcs</option>
                      <option value="Kits">Kits</option>
                      <option value="Rolls">Rolls</option>
                      <option value="Packs">Packs</option>
                      <option value="Pieces">Pieces</option>
                    </select>
                  )}
                </div>

                {/* Remove Line Button */}
                {items.length > 1 && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleRemoveProductLine(item.id)}
                    className="p-1 text-on-surface-variant hover:text-error transition-colors rounded disabled:opacity-40"
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
            disabled={isSubmitting}
            placeholder="Special loading instructions, dock gates, driver notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest resize-none disabled:opacity-60"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-md border-t border-outline-variant/20">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md hover:bg-surface-container-high transition-colors disabled:opacity-60"
          >
            Cancel
          </button>

          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('Draft')}
              className="px-space-md py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md hover:bg-surface-container-low transition-colors shadow-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm shadow-sm hover:opacity-95 transition-opacity font-semibold flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Creating Delivery...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Create Delivery</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
