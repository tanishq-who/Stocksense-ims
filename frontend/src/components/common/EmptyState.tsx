import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onClearFilters?: () => void;
  onCreateNew?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No deliveries found',
  description = 'No outward logistics records match your query or selected filtering parameters.',
  onClearFilters,
  onCreateNew,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-space-xl py-16 bg-surface-container-lowest rounded-xl shadow-sm text-center border border-outline-variant/30">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline mb-space-md">
        <span className="material-symbols-outlined text-[32px]">inventory_2</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mb-1">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-space-lg">
        {description}
      </p>
      <div className="flex items-center gap-space-sm">
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md hover:bg-surface-container-high transition-colors"
          >
            Clear Active Filters
          </button>
        )}
        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-body-md text-body-md shadow-sm hover:opacity-95 transition-opacity font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Create Delivery</span>
          </button>
        )}
      </div>
    </div>
  );
};
