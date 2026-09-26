import React, { useState, useEffect } from 'react';
import { ProductWithStock, CreateProductInput, UpdateProductInput } from '../../types/product';
import { BackendLocation } from '../../types/delivery';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProductInput | (UpdateProductInput & { id: number })) => Promise<void>;
  editingProduct?: ProductWithStock | null;
  locations: BackendLocation[];
  categories: string[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  locations,
  categories,
}) => {
  const isEditing = Boolean(editingProduct);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [price, setPrice] = useState<string>('0.00');
  const [unitOfMeasure, setUnitOfMeasure] = useState('pcs');
  const [reorderLevel, setReorderLevel] = useState<string>('10');
  const [initialStock, setInitialStock] = useState<string>('0');
  const [locationId, setLocationId] = useState<number | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setSku(editingProduct.sku || '');
      setDescription(editingProduct.description || '');
      setCategory(editingProduct.category || 'Electronics');
      setPrice(String(editingProduct.price ?? '0.00'));
      setUnitOfMeasure(editingProduct.unit_of_measure || 'pcs');
      setReorderLevel(String(editingProduct.reorder_level ?? '10'));
      setInitialStock(String(editingProduct.stockOnHand ?? '0'));
      setLocationId(editingProduct.locationId);
      setErrorMessage(null);
    } else {
      setName('');
      setSku('');
      setDescription('');
      setCategory(categories[0] || 'Electronics');
      setPrice('0.00');
      setUnitOfMeasure('pcs');
      setReorderLevel('10');
      setInitialStock('0');
      setLocationId(locations[0]?.id);
      setErrorMessage(null);
    }
  }, [editingProduct, isOpen, categories, locations]);

  if (!isOpen) return null;

  const autoGenerateSku = () => {
    const prefix = category.substring(0, 3).toUpperCase() || 'SKU';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`SKU-${prefix}-${rand}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Product Name is required.');
      return;
    }
    if (!sku.trim()) {
      setErrorMessage('SKU / Tracking Code is required.');
      return;
    }
    if (!unitOfMeasure.trim()) {
      setErrorMessage('Unit of Measure is required.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Price must be a valid number 0 or greater.');
      return;
    }

    const reorderNum = parseFloat(reorderLevel);
    if (isNaN(reorderNum) || reorderNum < 0) {
      setErrorMessage('Reorder Level must be a valid number 0 or greater.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingProduct) {
        await onSubmit({
          id: editingProduct.id,
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          price: priceNum,
          unit_of_measure: unitOfMeasure.trim(),
          reorder_level: reorderNum,
        });
      } else {
        const initStockNum = parseFloat(initialStock);
        await onSubmit({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          price: priceNum,
          unit_of_measure: unitOfMeasure.trim(),
          reorder_level: reorderNum,
          initialStock: !isNaN(initStockNum) && initStockNum > 0 ? initStockNum : undefined,
          locationId: locationId,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200 border-l border-outline-variant/30">
        {/* Header */}
        <div className="p-space-lg bg-surface-container-lowest flex items-start justify-between border-b border-surface-container">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-fixed/40 text-primary font-label-caps text-label-caps uppercase tracking-wider mb-1">
              <span>{isEditing ? 'Master Catalog Update' : 'Inventory Intake'}</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {isEditing
                ? 'Update SKU specifications, pricing, and reorder levels.'
                : 'Create a new inventory item and assign warehouse tracking.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mx-space-lg mt-space-md p-3 rounded-lg bg-error-container text-on-error-container text-body-sm font-body-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0">warning</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form id="product-form" onSubmit={handleSubmit} className="p-space-lg overflow-y-auto flex-1 flex flex-col gap-space-md">
          {/* Product Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-pname">
              Product Name *
            </label>
            <input
              id="inp-pname"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Industrial Sensor Module X-90"
              className="h-10 px-3 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-low focus:ring-1 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          {/* SKU Code with Auto Generator */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-sku">
                SKU / Tracking Code *
              </label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={autoGenerateSku}
                  className="font-label-code text-label-code text-primary hover:underline"
                >
                  Auto-generate
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="inp-sku"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-SN-9011"
                className="w-full h-10 px-3 rounded-lg bg-surface font-label-code text-label-code text-on-surface placeholder:text-outline uppercase focus:outline-none focus:bg-surface-container-low focus:ring-1 focus:ring-primary border border-outline-variant/30 font-mono"
              />
            </div>
          </div>

          {/* Category & Unit of Measure */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-category">
                Category *
              </label>
              <div className="relative">
                <select
                  id="inp-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-low border border-outline-variant/30 cursor-pointer"
                >
                  {Array.from(new Set([...categories, 'Electronics', 'Packaging', 'Hardware', 'Raw Materials', 'Chemical'])).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-uom">
                Unit of Measure *
              </label>
              <div className="relative">
                <select
                  id="inp-uom"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-low border border-outline-variant/30 cursor-pointer"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="boxes">Boxes (boxes)</option>
                  <option value="units">Units (units)</option>
                  <option value="rolls">Rolls (rolls)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="liters">Liters (L)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Price & Reorder Level */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-price">
                Unit Price ($)
              </label>
              <input
                id="inp-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface font-label-code text-label-code text-on-surface focus:outline-none focus:bg-surface-container-low border border-outline-variant/30 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-reorder">
                Reorder Level *
              </label>
              <input
                id="inp-reorder"
                type="number"
                min="0"
                required
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface font-label-code text-label-code text-on-surface focus:outline-none focus:bg-surface-container-low border border-outline-variant/30 font-mono"
              />
            </div>
          </div>

          {/* Initial Stock & Location (New Product only) */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="flex flex-col gap-1.5">
                <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-stock">
                  Initial Stock Count
                </label>
                <input
                  id="inp-stock"
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface font-label-code text-label-code text-on-surface focus:outline-none focus:bg-surface-container-low border border-outline-variant/30 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-location">
                  Initial Location
                </label>
                <div className="relative">
                  <select
                    id="inp-location"
                    value={locationId || ''}
                    onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-10 px-3 pr-8 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-low border border-outline-variant/30 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} {loc.code ? `(${loc.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-on-surface" htmlFor="inp-desc">
              Description / Notes
            </label>
            <textarea
              id="inp-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specifications, supplier alias, or handling instructions..."
              className="p-3 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-low border border-outline-variant/30 resize-none"
            />
          </div>

          <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center gap-space-sm mt-space-xs">
            <span className="material-symbols-outlined text-[20px] text-secondary">verified</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Reorder alert thresholds will update dynamically across the StockSense dashboard.
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="p-space-lg bg-surface-container-lowest flex items-center justify-end gap-space-sm border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 px-space-lg rounded-xl bg-surface-container text-on-surface font-body-sm text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            className="h-10 px-space-lg rounded-xl bg-primary-container text-on-primary font-body-sm text-body-sm font-semibold shadow-sm hover:bg-primary transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>{isEditing ? 'Update Product' : 'Save Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
