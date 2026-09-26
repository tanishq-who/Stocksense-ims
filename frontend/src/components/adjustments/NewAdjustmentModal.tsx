import React, { useState, useEffect } from 'react';
import { CreateAdjustmentInput } from '../../types/adjustment';
import { BackendLocation, BackendProduct } from '../../types/delivery';
import { LocationStockLevel } from '../../api/adjustmentService';

interface NewAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAdjustmentInput) => Promise<void>;
  locations: BackendLocation[];
  products: BackendProduct[];
  stockLevels: LocationStockLevel[];
}

interface ProductLineForm {
  productId: number;
  physicalCount: string;
}

export const NewAdjustmentModal: React.FC<NewAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  locations,
  products,
  stockLevels,
}) => {
  const [locationId, setLocationId] = useState<number | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState<ProductLineForm[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'draft' | 'validate'>('draft');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form defaults when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocationId(locations[0]?.id);
      setReason('');
      setErrorMessage(null);

      if (products.length > 0) {
        // Calculate initial count from recorded stock
        const initialProdId = products[0].id;
        const initialLocId = locations[0]?.id;
        const recorded =
          stockLevels.find(
            (sl) => sl.productId === initialProdId && sl.locationId === initialLocId
          )?.quantity || 0;

        setLines([
          {
            productId: initialProdId,
            physicalCount: String(recorded),
          },
        ]);
      } else {
        setLines([]);
      }
    }
  }, [isOpen, locations, products, stockLevels]);

  if (!isOpen) return null;

  // Helper to look up recorded stock for a product at selected location
  const getRecordedStock = (prodId: number): number => {
    if (!locationId) return 0;
    const match = stockLevels.find(
      (sl) => sl.productId === prodId && sl.locationId === locationId
    );
    return match ? match.quantity : 0;
  };

  const handleAddLine = () => {
    const nextProd = products.find((p) => !lines.some((l) => l.productId === p.id)) || products[0];
    if (nextProd) {
      const recorded = getRecordedStock(nextProd.id);
      setLines((prev) => [
        ...prev,
        {
          productId: nextProd.id,
          physicalCount: String(recorded),
        },
      ]);
    }
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: 'productId' | 'physicalCount', val: any) => {
    setLines((prev) => {
      const copy = [...prev];
      if (field === 'productId') {
        const recorded = getRecordedStock(Number(val));
        copy[index] = { productId: Number(val), physicalCount: String(recorded) };
      } else {
        copy[index] = { ...copy[index], physicalCount: val };
      }
      return copy;
    });
  };

  const handleSubmit = async (validateImmediately: boolean) => {
    setErrorMessage(null);

    if (!locationId) {
      setErrorMessage('Please select a valid warehouse location where adjustment is performed.');
      return;
    }

    if (lines.length === 0) {
      setErrorMessage('Please add at least one product item to adjust.');
      return;
    }

    // Validate physical count is non-negative number
    for (let i = 0; i < lines.length; i++) {
      const num = Number(lines[i].physicalCount);
      if (isNaN(num) || num < 0) {
        setErrorMessage(
          `Line #${i + 1} must have a valid physical count quantity of zero or greater.`
        );
        return;
      }
    }

    // Check for duplicate products
    const seenProducts = new Set<number>();
    for (const line of lines) {
      if (seenProducts.has(line.productId)) {
        setErrorMessage(
          'Duplicate products detected in adjustment lines. Please combine physical counts.'
        );
        return;
      }
      seenProducts.add(line.productId);
    }

    setIsSubmitting(true);
    setSubmitMode(validateImmediately ? 'validate' : 'draft');

    try {
      await onSubmit({
        locationId,
        reason: reason.trim() || undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          physicalCount: Number(l.physicalCount),
        })),
        validateImmediately,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create adjustment.';
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
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-caps text-label-caps font-bold">
                OPERATIONS
              </span>
              <span className="font-label-code text-label-code text-on-surface-variant font-mono">
                CYCLE COUNT & RECONCILIATION
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mt-1">
              New Inventory Adjustment
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Reconcile physical inventory counts against system records and post variance ledger entries.
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

          {/* Location & Reason Configuration */}
          <div className="bg-surface-container-low/60 rounded-xl p-space-md flex flex-col gap-space-md border border-outline-variant/20">
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                Warehouse Audit Location *
              </label>
              <select
                value={locationId || ''}
                onChange={(e) => setLocationId(Number(e.target.value))}
                className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg font-body-md text-on-surface font-semibold border border-outline-variant/20 focus:ring-2 focus:ring-primary shadow-xs"
              >
                {locations.map((loc) => (
                  <option key={`loc-${loc.id}`} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                Adjustment Reason / Audit Notes (Optional)
              </label>
              <input
                type="text"
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual cycle count, damaged stock drop, count variance"
                className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg font-body-sm text-on-surface border border-outline-variant/20 focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>
          </div>

          {/* Product Items Payload */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  fact_check
                </span>
                Counted Products ({lines.length})
              </span>
              <span className="font-label-code text-label-code text-on-surface-variant font-mono">
                Location #{locationId}
              </span>
            </div>

            {lines.map((line, idx) => {
              const selectedProd = products.find((p) => p.id === line.productId);
              const recordedStock = getRecordedStock(line.productId);
              const countedNum = Number(line.physicalCount) || 0;
              const diff = countedNum - recordedStock;

              return (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-outline-variant/20 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex-1">
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                        Product Item #{idx + 1}
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
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-on-surface-variant">
                        <span>SKU: {selectedProd?.sku || '—'}</span>
                        <span>•</span>
                        <span>UOM: {selectedProd?.unit_of_measure || 'units'}</span>
                      </div>
                    </div>

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        title="Remove product line"
                        className="text-on-surface-variant hover:text-error transition-colors p-1 mt-5"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>

                  {/* Count & Variance Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm items-center bg-surface-container-low/40 p-2.5 rounded-lg border border-outline-variant/10">
                    <div>
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                        Recorded On-Hand
                      </span>
                      <span className="font-label-code text-on-surface font-mono font-medium block">
                        {recordedStock} {selectedProd?.unit_of_measure || 'units'}
                      </span>
                    </div>

                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                        Physical Count *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={line.physicalCount}
                        onChange={(e) => handleLineChange(idx, 'physicalCount', e.target.value)}
                        className="w-full bg-surface-container-lowest px-2.5 py-1 rounded font-label-code text-on-surface font-bold shadow-xs focus:ring-2 focus:ring-primary focus:outline-none border border-outline-variant/20 font-mono"
                      />
                    </div>

                    <div>
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                        Reconciliation Delta
                      </span>
                      {diff > 0 ? (
                        <span className="font-label-code text-[11px] text-tertiary font-bold flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                          Gain: +{diff} {selectedProd?.unit_of_measure || 'units'}
                        </span>
                      ) : diff < 0 ? (
                        <span className="font-label-code text-[11px] text-error font-bold flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[14px]">
                            arrow_downward
                          </span>
                          Drop: {diff} {selectedProd?.unit_of_measure || 'units'}
                        </span>
                      ) : (
                        <span className="font-label-code text-[11px] text-on-surface-variant font-medium flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Neutral (0 variance)
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
              <span>Add Another Counted Product</span>
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
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-initial px-space-md py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md font-medium disabled:opacity-50 border border-outline-variant/20"
            >
              {isSubmitting && submitMode === 'draft' ? 'Saving...' : 'Save Draft Count'}
            </button>

            {/* Apply & Validate Immediately */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-space-lg py-2 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-all font-body-md text-body-md font-semibold shadow-md shadow-primary-container/20 disabled:opacity-50"
            >
              {isSubmitting && submitMode === 'validate' ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  <span>Applying to Ledger...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Apply & Post to Stock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
