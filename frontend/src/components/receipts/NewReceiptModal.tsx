import React, { useState, useEffect } from 'react';
import { CreateReceiptInput } from '../../types/receipt';
import { BackendLocation, BackendProduct } from '../../types/delivery';

interface NewReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateReceiptInput) => Promise<void>;
  locations: BackendLocation[];
  products: BackendProduct[];
}

interface ProductLineForm {
  productId: number;
  quantity: string;
}

export const NewReceiptModal: React.FC<NewReceiptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  locations,
  products,
}) => {
  const [supplier, setSupplier] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState<number | undefined>(undefined);
  const [scheduledDate, setScheduledDate] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [lines, setLines] = useState<ProductLineForm[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setSupplier('');
      setDestinationLocationId(locations[0]?.id);
      setScheduledDate(new Date().toISOString().slice(0, 16));
      setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setErrorMessage(null);

      if (products.length > 0) {
        setLines([
          {
            productId: products[0].id,
            quantity: '50',
          },
        ]);
      } else {
        setLines([]);
      }
    }
  }, [isOpen, locations, products]);

  if (!isOpen) return null;

  const handleAddLine = () => {
    const nextProd = products.find((p) => !lines.some((l) => l.productId === p.id)) || products[0];
    if (nextProd) {
      setLines((prev) => [...prev, { productId: nextProd.id, quantity: '10' }]);
    }
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLineProductChange = (index: number, newProductId: number) => {
    setLines((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, productId: newProductId } : l))
    );
  };

  const handleLineQtyChange = (index: number, qty: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === index ? { ...l, quantity: qty } : l)));
  };

  const totalLines = lines.length;
  const totalQuantity = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0);

  const handleSubmit = async (validateImmediately: boolean) => {
    setErrorMessage(null);

    if (!supplier.trim()) {
      setErrorMessage('Supplier name is required.');
      return;
    }

    if (!destinationLocationId) {
      setErrorMessage('Please select a destination warehouse bay.');
      return;
    }

    if (lines.length === 0) {
      setErrorMessage('At least one product line is required for an inbound receipt.');
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const q = parseFloat(lines[i].quantity);
      if (isNaN(q) || q <= 0) {
        setErrorMessage(`Line ${i + 1}: Quantity must be greater than 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        supplier: supplier.trim(),
        destinationLocationId,
        scheduledDate: scheduledDate || undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: parseFloat(l.quantity),
        })),
        validateImmediately,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create receipt.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200 border-l border-outline-variant/30">
        {/* Header */}
        <div className="p-space-lg bg-surface-container-lowest shadow-sm flex items-start justify-between border-b border-surface-container">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-primary-fixed text-primary">
                <span className="material-symbols-outlined text-[20px]">post_add</span>
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Create Inbound Receipt
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Record incoming shipment from vendor PO &amp; assign put-away docks.
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

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-space-lg mt-space-md p-3 rounded-lg bg-error-container text-on-error-container text-body-sm font-body-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0">warning</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-space-lg space-y-space-lg">
          {/* Step 1: Shipment Parameters */}
          <div className="space-y-space-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[18px] text-primary">
                local_shipping
              </span>
              <span>1. Shipment Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {/* Supplier Input / Datalist */}
              <div>
                <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">
                  Supplier Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. Apex Logistics, Global Tech"
                  className="w-full px-space-md py-2 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-outline-variant/30"
                />
              </div>

              {/* Destination Location Dropdown */}
              <div>
                <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">
                  Destination Warehouse / Bay <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    value={destinationLocationId || ''}
                    onChange={(e) => setDestinationLocationId(Number(e.target.value))}
                    className="w-full px-space-md py-2 pr-8 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-outline-variant/30 appearance-none cursor-pointer"
                  >
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

              {/* Scheduled Date */}
              <div>
                <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">
                  Scheduled Arrival Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-space-md py-1.5 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-outline-variant/30"
                />
              </div>

              {/* PO Reference */}
              <div>
                <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">
                  PO Reference Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                    tag
                  </span>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-2026-9941"
                    className="w-full pl-8 pr-space-md py-1.5 rounded-lg bg-surface font-label-code text-label-code text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-outline-variant/30 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Inbound Products Manifest */}
          <div className="space-y-space-md pt-space-sm border-t border-surface-container">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  format_list_bulleted
                </span>
                <span>2. Inbound Products Manifest</span>
              </h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 text-primary hover:text-on-primary-fixed-variant font-body-sm text-body-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Add Product</span>
              </button>
            </div>

            {/* Items Table Container */}
            <div className="bg-surface rounded-xl overflow-hidden shadow-sm border border-outline-variant/30">
              <div className="px-space-md py-2 bg-surface-container font-label-caps text-[10px] uppercase text-on-surface-variant grid grid-cols-12 gap-2">
                <div className="col-span-5 font-semibold">Item &amp; Description</div>
                <div className="col-span-3 font-semibold">SKU</div>
                <div className="col-span-2 text-right font-semibold">Qty</div>
                <div className="col-span-1 text-center font-semibold">UOM</div>
                <div className="col-span-1 text-center font-semibold">Action</div>
              </div>

              {/* Lines List */}
              <div className="divide-y divide-surface-container font-body-md text-body-md">
                {lines.map((line, idx) => {
                  const selectedProd = products.find((p) => p.id === line.productId);

                  return (
                    <div
                      key={idx}
                      className="p-space-sm grid grid-cols-12 gap-2 items-center hover:bg-surface-container-low transition-colors"
                    >
                      {/* Product Selector */}
                      <div className="col-span-5">
                        <select
                          value={line.productId}
                          onChange={(e) => handleLineProductChange(idx, Number(e.target.value))}
                          className="w-full bg-surface-container-lowest text-on-surface text-[12px] rounded p-1.5 focus:ring-1 focus:ring-primary border border-outline-variant/30 cursor-pointer truncate"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SKU Display */}
                      <div className="col-span-3 font-label-code text-[11px] truncate">
                        <div className="font-semibold text-primary font-mono truncate">
                          {selectedProd?.sku || `SKU-${line.productId}`}
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                          className="w-full text-right p-1.5 bg-surface-container-lowest text-on-surface rounded text-[12px] font-label-code focus:ring-1 focus:ring-primary border border-outline-variant/30 font-mono"
                        />
                      </div>

                      {/* UOM */}
                      <div className="col-span-1 text-center font-label-code text-[11px] text-on-surface-variant font-mono">
                        {selectedProd?.unit_of_measure || 'pcs'}
                      </div>

                      {/* Delete Line */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={lines.length <= 1}
                          onClick={() => handleRemoveLine(idx)}
                          className="text-on-surface-variant hover:text-error p-1 disabled:opacity-30 transition-colors"
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Summary Bar */}
            <div className="p-space-sm bg-surface-container-high rounded-lg flex items-center justify-between font-label-code text-label-code font-mono">
              <span className="text-on-surface-variant">Live Manifest Summary:</span>
              <span className="text-on-surface font-bold">
                Total Products: {totalLines} {totalLines === 1 ? 'Line' : 'Lines'} | Total Quantity:{' '}
                {totalQuantity} units
              </span>
            </div>

            {/* Validation Rule Callout */}
            <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-body-sm text-[12px] flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                info
              </span>
              <div>
                <strong>Validation Rule:</strong> Supplier, Destination, and at least 1 valid product
                line with positive quantity are required before posting to stock registers.
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-space-lg bg-surface-container-lowest shadow-[0_-2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between gap-space-sm border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-space-md py-2 rounded-xl bg-surface-container text-on-surface font-body-md text-body-md font-medium hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-space-md py-2 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md font-medium shadow-sm hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-2 px-space-lg py-2 rounded-xl bg-tertiary-container text-on-tertiary font-body-md text-body-md font-semibold shadow hover:bg-tertiary transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{isSubmitting ? 'Posting...' : 'Validate & Post to Stock'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
