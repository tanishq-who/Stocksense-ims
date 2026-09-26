import React from 'react';
import { Adjustment } from '../../types/adjustment';

interface AdjustmentMetricsProps {
  adjustments: Adjustment[];
  selectedStatus?: string;
  selectedDiscrepancy?: string;
  onStatusClick?: (status: string) => void;
  onDiscrepancyClick?: (type: 'all' | 'positive' | 'negative') => void;
}

export const AdjustmentMetrics: React.FC<AdjustmentMetricsProps> = ({
  adjustments,
  selectedStatus,
  selectedDiscrepancy,
  onStatusClick,
  onDiscrepancyClick,
}) => {
  const totalCount = adjustments.length;
  const pendingCount = adjustments.filter((a) => a.status === 'Draft' || a.status === 'Waiting').length;

  let totalPositiveUnits = 0;
  let positiveItemCount = 0;
  let totalNegativeUnits = 0;
  let negativeItemCount = 0;

  adjustments.forEach((adj) => {
    adj.items.forEach((item) => {
      if (item.difference > 0) {
        positiveItemCount++;
        totalPositiveUnits += item.difference;
      } else if (item.difference < 0) {
        negativeItemCount++;
        totalNegativeUnits += Math.abs(item.difference);
      }
    });
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-lg">
      {/* KPI 1: Total Adjustments */}
      <div
        onClick={() => {
          onStatusClick?.('all');
          onDiscrepancyClick?.('all');
        }}
        className={`bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus === 'all' && selectedDiscrepancy === 'all' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Total Adjustments
            </span>
            <div className="flex items-baseline gap-space-sm mt-1">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                {totalCount}
              </span>
              <span className="font-label-code text-label-code text-secondary font-medium font-mono">
                active batch
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-fixed/50 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">fact_check</span>
          </div>
        </div>
        <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-secondary h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(15, totalCount * 10))}%` }}
          />
        </div>
      </div>

      {/* KPI 2: Pending Approvals / Draft */}
      <div
        onClick={() => onStatusClick?.('draft')}
        className={`bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20 ${
          onStatusClick ? 'cursor-pointer' : ''
        } ${selectedStatus?.toLowerCase() === 'draft' ? 'ring-2 ring-secondary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Pending Approvals
            </span>
            <div className="flex items-baseline gap-space-sm mt-1">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                {pendingCount}
              </span>
              <span className="px-space-xs py-0.5 rounded font-label-caps text-label-caps bg-surface-container-high text-secondary font-semibold">
                IN REVIEW
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-3 truncate">
          Awaiting validation sign-off
        </p>
      </div>

      {/* KPI 3: Stock Increased */}
      <div
        onClick={() => onDiscrepancyClick?.('positive')}
        className={`bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20 ${
          onDiscrepancyClick ? 'cursor-pointer' : ''
        } ${selectedDiscrepancy === 'positive' ? 'ring-2 ring-tertiary ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Stock Increased
            </span>
            <div className="flex items-baseline gap-space-sm mt-1">
              <span className="font-headline-xl text-headline-xl text-tertiary font-bold">
                {positiveItemCount}
              </span>
              <span className="px-space-xs py-0.5 rounded font-label-caps text-label-caps bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold font-mono">
                +{totalPositiveUnits} UNITS
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/60 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">trending_up</span>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-tertiary font-medium mt-3 truncate">
          Found stock & inbound gains
        </p>
      </div>

      {/* KPI 4: Stock Decreased */}
      <div
        onClick={() => onDiscrepancyClick?.('negative')}
        className={`bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20 ${
          onDiscrepancyClick ? 'cursor-pointer' : ''
        } ${selectedDiscrepancy === 'negative' ? 'ring-2 ring-error ring-offset-1' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Stock Decreased
            </span>
            <div className="flex items-baseline gap-space-sm mt-1">
              <span className="font-headline-xl text-headline-xl text-error font-bold">
                {negativeItemCount}
              </span>
              <span className="px-space-xs py-0.5 rounded font-label-caps text-label-caps bg-error-container text-on-error-container font-semibold font-mono">
                -{totalNegativeUnits} UNITS
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-error-container/60 text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">trending_down</span>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-error font-medium mt-3 truncate">
          Damaged, write-offs & variance drops
        </p>
      </div>
    </div>
  );
};
