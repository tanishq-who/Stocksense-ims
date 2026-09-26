import React, { useState, useEffect } from 'react';
import { CreateTransferInput } from '../../types/transfer';
import { BackendLocation, BackendProduct } from '../../types/delivery';
import { LocationStock } from '../../api/transferService';

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTransferInput) => Promise<void>;
  locations: BackendLocation[];
  products: BackendProduct[];
  stockLevels: LocationStock[];
}

interface ProductLineForm {
  productId: number;
  quantity: string;
}

export const NewTransferModal: React.FC<NewTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  locations,
  products,
  stockLevels,
}) => {
  const [sourceLocationId, setSourceLocationId] = useState<number | undefined>(undefined);
  const [destinationLocationId, setDestinationLocationId] = useState<number | undefined>(undefined);
  const [scheduledDate, setScheduledDate] = useState('');
  const [lines, setLines] = useState<ProductLineForm[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'draft' | 'validate'>('draft');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form defaults when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (locations.length >= 2) {
        setSourceLocationId(locations[0].id);
        setDestinationLocationId(locations[1].id);
      } else if (locations.length === 1) {
        setSourceLocationId(locations[0].id);
        setDestinationLocationId(undefined);
      }

      setScheduledDate(new Date().toISOString().slice(0, 16));
      setErrorMessage(null);

      if (products.length > 0) {
        setLines([
          {
            productId: products[0].id,
            quantity: '10',
          },
        ]);
      } else {
        setLines([]);
      }
    }
  }, [isOpen, locations, products]);

  if (!isOpen) return null;

  // Helper to look up available stock for a product at selected source location
  const getAvailableStockAtSource = (productId: number): number => {
    if (!sourceLocationId) return 0;
    const match = stockLevels.find(
      (sl) => sl.productId === productId && sl.locationId === sourceLocationId
    );
    return match ? match.quantity : 0;
  };

  const handleAddLine = () => {
    const nextProd = products.find((p) => !lines.some((l) => l.productId === p.id)) || products[0];
    if (nextProd) {
      setLines((prev) => [
        ...prev,
        {
          productId: nextProd.id,
          quantity: '5',
        },
      ]);
    }
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: 'productId' | 'quantity', val: any) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const isLocationConflict =
    Boolean(sourceLocationId) &&
    Boolean(destinationLocationId) &&
    sourceLocationId === destinationLocationId;

  const handleSubmit = async (validateImmediately: boolean) => {
    setErrorMessage(null);

    if (!sourceLocationId) {
      setErrorMessage('Please select a valid origin (source) location.');
      return;
    }

    if (!destinationLocationId) {
      setErrorMessage('Please select a valid destination location.');
      return;
    }

    if (sourceLocationId === destinationLocationId) {
      setErrorMessage('Source location and destination location must be different.');
      return;
    }

    if (lines.length === 0) {
      setErrorMessage('Please add at least one product line item to transfer.');
      return;
    }

    // Check for positive quantities
    for (let i = 0; i < lines.length; i++) {
      const num = Number(lines[i].quantity);
      if (isNaN(num) || num <= 0) {
        setErrorMessage(`Line #${i + 1} must have a valid positive quantity greater than zero.`);
        return;
      }
    }

    // Check for duplicate products in lines
    const productIds = new Set<number>();
    for (const line of lines) {
      if (productIds.has(line.productId)) {
        setErrorMessage('Cannot select the same product in multiple lines. Please combine quantities.');
        return;
      }
      productIds.add(line.productId);
    }

    setIsSubmitting(true);
    setSubmitMode(validateImmediately ? 'validate' : 'draft');

    try {
      await onSubmit({
        sourceLocationId,
        destinationLocationId,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
        })),
        validateImmediately,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transfer operation failed.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest shadow-2xl flex flex-col justify-between overflow-hidden border-l border-outline-variant/30 animate-in slide-in-from-right duration-300 z-10">
        {/* Drawer Header */}
        <div className="p-space-lg bg-surface-container-low flex items-start justify-between border-b border-surface-container">
          <div>
            <div className="flex items-center gap-space-xs">
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-caps text-label-caps font-bold">
                OPERATIONS
              </span>
              <span className="font-label-code text-label-code text-on-surface-variant font-mono">
                BAY-TO-BAY RELOCATION
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mt-1">
              New Internal Transfer
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Create an internal stock relocation request across zones, bays, or facilities.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drawer Form Body */}
        <div className="p-space-lg flex-1 overflow-y-auto flex flex-col gap-space-lg">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                error_outline
              </span>
              <div className="flex-1 text-body-sm font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Route Specification Section */}
          <div className="bg-surface-container-low/60 rounded-xl p-space-md flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  alt_route
                </span>
                Route Specification
              </span>
              {!isLocationConflict && sourceLocationId && destinationLocationId && (
                <span className="font-label-code text-[11px] text-tertiary font-semibold flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Route Validated
                </span>
              )}
            </div>

            {/* Route visual grid: Origin -> Arrow -> Destination */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-space-sm">
              {/* Origin (Source) */}
              <div className="bg-surface-container-lowest rounded-lg p-3 shadow-xs flex flex-col gap-1.5 border border-outline-variant/20">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                  From (Origin Location) *
                </label>
                <select
                  value={sourceLocationId || ''}
                  onChange={(e) => setSourceLocationId(Number(e.target.value))}
                  className="bg-surface-container-low px-2.5 py-1.5 rounded font-body-sm text-on-surface font-medium border-none focus:ring-2 focus:ring-primary w-full"
                >
                  <option value="" disabled>
                    Select source bay
                  </option>
                  {locations.map((loc) => (
                    <option key={`src-opt-${loc.id}`} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-on-surface-variant font-mono">
                  <span className="material-symbols-outlined text-[14px] text-outline">
                    warehouse
                  </span>
                  <span>Zone #{sourceLocationId || '—'}</span>
                </div>
              </div>

              {/* Route arrow indicator */}
              <div className="flex items-center justify-center p-2 text-primary">
                <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>

              {/* Destination */}
              <div className="bg-surface-container-lowest rounded-lg p-3 shadow-xs flex flex-col gap-1.5 border border-outline-variant/20">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                  To (Destination Location) *
                </label>
                <select
                  value={destinationLocationId || ''}
                  onChange={(e) => setDestinationLocationId(Number(e.target.value))}
                  className="bg-surface-container-low px-2.5 py-1.5 rounded font-body-sm text-on-surface font-medium border-none focus:ring-2 focus:ring-primary w-full"
                >
                  <option value="" disabled>
                    Select destination bay
                  </option>
                  {locations.map((loc) => (
                    <option key={`dest-opt-${loc.id}`} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-on-surface-variant font-mono">
                  <span className="material-symbols-outlined text-[14px] text-outline">
                    move_to_inbox
                  </span>
                  <span>Zone #{destinationLocationId || '—'}</span>
                </div>
              </div>
            </div>

            {/* Validation conflict warning */}
            {isLocationConflict ? (
              <div className="bg-error-container/30 border border-error/30 rounded-lg p-2.5 flex items-center gap-2 text-body-sm text-error font-medium">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>Conflict: Source location and destination location must be different.</span>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-lg p-2.5 flex items-center gap-2 text-body-sm text-tertiary border border-outline-variant/10">
                <span className="material-symbols-outlined text-[16px] text-tertiary">verified</span>
                <span>Inter-facility routing verified. Ready for inventory reallocation.</span>
              </div>
            )}

            {/* Scheduled Dispatch Date */}
            <div className="pt-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                Scheduled Dispatch Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-surface-container-lowest px-3 py-1.5 rounded-lg font-body-sm text-on-surface shadow-xs focus:ring-2 focus:ring-primary focus:outline-none border border-outline-variant/20"
              />
            </div>
          </div>

          {/* Products Payload Section */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  inventory_2
                </span>
                Items To Move (Payload)
              </span>
              <span className="font-label-code text-label-code text-on-surface-variant font-mono">
                {lines.length} {lines.length === 1 ? 'Line Item' : 'Line Items'}
              </span>
            </div>

            {lines.map((line, idx) => {
              const selectedProd = products.find((p) => p.id === line.productId);
              const availableStock = getAvailableStockAtSource(line.productId);
              const requestedNum = Number(line.quantity) || 0;
              const hasInsufficientWarning = sourceLocationId && requestedNum > availableStock;

              return (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-outline-variant/20 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex-1">
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                        Product #{idx + 1}
                      </label>
                      <select
                        value={line.productId}
                        onChange={(e) =>
                          handleLineChange(idx, 'productId', Number(e.target.value))
                        }
                        className="w-full bg-surface-container-low px-3 py-1.5 rounded-lg font-body-md text-on-surface font-semibold border border-outline-variant/20 focus:ring-2 focus:ring-primary"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-semibold">
                          Available at source: {availableStock} {selectedProd?.unit_of_measure || 'units'}
                        </span>
                        <span className="text-on-surface-variant">
                          SKU: {selectedProd?.sku || '—'}
                        </span>
                      </div>
                    </div>

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        title="Remove line item"
                        className="text-on-surface-variant hover:text-error transition-colors p-1 mt-5"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm items-center bg-surface-container-low/40 p-2.5 rounded-lg border border-outline-variant/10">
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                        Transfer Qty *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                        className="w-full bg-surface-container-lowest px-2.5 py-1 rounded font-label-code text-on-surface font-bold shadow-xs focus:ring-2 focus:ring-primary focus:outline-none border border-outline-variant/20 font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                        Unit of Measure
                      </label>
                      <span className="font-body-sm text-on-surface font-medium">
                        {selectedProd?.unit_of_measure || 'units'}
                      </span>
                    </div>

                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                        Validation State
                      </label>
                      {hasInsufficientWarning ? (
                        <span className="font-label-code text-[11px] text-error font-semibold flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Shortage: {requestedNum - availableStock}
                        </span>
                      ) : (
                        <span className="font-label-code text-[11px] text-tertiary font-semibold flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          In Stock ({requestedNum}/{availableStock})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddLine}
              className="py-2.5 px-4 rounded-xl border border-dashed border-primary/40 text-primary font-body-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Add Another Product Line</span>
            </button>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="p-space-lg bg-surface-container-low border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-full sm:w-auto px-space-md py-2 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors font-body-md text-body-md font-medium border border-outline-variant/20"
          >
            Cancel
          </button>

          <div className="flex items-center gap-space-sm w-full sm:w-auto">
            {/* Save as Draft */}
            <button
              type="button"
              disabled={isSubmitting || isLocationConflict}
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-initial px-space-md py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md font-medium disabled:opacity-50 border border-outline-variant/20"
            >
              {isSubmitting && submitMode === 'draft' ? 'Saving...' : 'Save Draft Transfer'}
            </button>

            {/* Validate & Dispatch Immediately */}
            <button
              type="button"
              disabled={isSubmitting || isLocationConflict}
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-space-lg py-2 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-all font-body-md text-body-md font-semibold shadow-md shadow-primary-container/20 disabled:opacity-50"
            >
              {isSubmitting && submitMode === 'validate' ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  <span>Posting to Stock...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Validate & Dispatch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
