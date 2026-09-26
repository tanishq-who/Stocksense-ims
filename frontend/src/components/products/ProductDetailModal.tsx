import React from 'react';
import { ProductWithStock } from '../../types/product';
import { formatDate } from '../../utils/formatters';

interface ProductDetailModalProps {
  product: ProductWithStock | null;
  onClose: () => void;
  onEdit: (product: ProductWithStock) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onEdit,
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-surface-container-low flex items-start justify-between border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                {product.name}
              </h3>
              <p className="font-label-code text-label-code text-on-surface-variant font-mono">
                {product.sku}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-container-low/60 flex flex-col">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Stock on Hand
              </span>
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1 font-mono">
                {product.stockOnHand} {product.unit_of_measure}
              </span>
              <span className="text-[11px] text-on-surface-variant mt-0.5">
                Available: {product.availableStock} | Reserved: {product.reservedStock}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/60 flex flex-col">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Unit Price
              </span>
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1 font-mono">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-[11px] text-on-surface-variant mt-0.5 font-mono">
                Min Reorder Level: {product.reorder_level}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 text-body-sm font-body-sm pt-2">
            <div className="flex justify-between py-1.5 border-b border-surface-container">
              <span className="text-on-surface-variant">Category</span>
              <span className="font-medium text-on-surface">{product.category || 'General'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-surface-container">
              <span className="text-on-surface-variant">Unit of Measure</span>
              <span className="font-medium text-on-surface font-mono">{product.unit_of_measure}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-surface-container">
              <span className="text-on-surface-variant">Primary Location</span>
              <span className="font-medium text-on-surface">{product.locationName || 'Unassigned'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-surface-container">
              <span className="text-on-surface-variant">Status</span>
              <span className="font-medium text-on-surface">{product.status}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-surface-container">
              <span className="text-on-surface-variant">Registered Date</span>
              <span className="font-medium text-on-surface font-mono">
                {formatDate(product.created_at)}
              </span>
            </div>

            {product.description && (
              <div className="pt-2">
                <span className="text-on-surface-variant block mb-1">Description</span>
                <p className="p-3 rounded-lg bg-surface-container-low/60 text-on-surface text-body-sm">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-lowest flex items-center justify-end gap-2 border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-body-sm text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-body-sm text-body-sm font-medium hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Edit Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};
