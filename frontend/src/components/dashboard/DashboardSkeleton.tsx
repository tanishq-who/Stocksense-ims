import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Skeleton KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest p-4 rounded-xl shadow-sm h-32 flex flex-col justify-between border border-outline-variant/20"
          >
            <div className="h-4 bg-surface-container-high rounded w-3/4" />
            <div className="h-8 bg-surface-container-high rounded w-1/2" />
            <div className="h-4 bg-surface-container-high rounded w-2/3" />
          </div>
        ))}
      </div>

      {/* Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm h-48 border border-outline-variant/20">
            <div className="h-6 bg-surface-container-high rounded w-1/3 mb-4" />
            <div className="h-4 bg-surface-container rounded-full w-full mb-6" />
            <div className="grid grid-cols-4 gap-4">
              <div className="h-12 bg-surface-container-low rounded" />
              <div className="h-12 bg-surface-container-low rounded" />
              <div className="h-12 bg-surface-container-low rounded" />
              <div className="h-12 bg-surface-container-low rounded" />
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm h-96 border border-outline-variant/20">
            <div className="h-6 bg-surface-container-high rounded w-1/4 mb-4" />
            <div className="space-y-3">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-10 bg-surface-container-low rounded w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm h-96 border border-outline-variant/20">
            <div className="h-6 bg-surface-container-high rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, k) => (
                <div key={k} className="h-16 bg-surface-container-low rounded w-full" />
              ))}
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm h-48 border border-outline-variant/20">
            <div className="h-6 bg-surface-container-high rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-10 bg-surface-container-low rounded" />
              <div className="h-10 bg-surface-container-low rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
