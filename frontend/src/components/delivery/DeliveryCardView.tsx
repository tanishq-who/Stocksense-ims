import React from 'react';
import { Delivery } from '../../types/delivery';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/formatters';

interface DeliveryCardViewProps {
  deliveries: Delivery[];
  onSelectDelivery?: (delivery: Delivery) => void;
}

export const DeliveryCardView: React.FC<DeliveryCardViewProps> = ({
  deliveries,
  onSelectDelivery,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
      {deliveries.map((delivery) => {
        const isCanceled = delivery.status === 'Canceled';

        return (
          <div
            key={delivery.id}
            onClick={() => onSelectDelivery?.(delivery)}
            className={`p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:bg-surface-container-low transition-all cursor-pointer ${
              isCanceled ? 'opacity-80' : ''
            }`}
          >
            <div>
              {/* Header row: Reference, Date, Status */}
              <div className="flex items-center justify-between mb-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span
                    className={`font-label-code text-label-code font-bold font-mono ${
                      isCanceled ? 'line-through text-on-surface-variant' : 'text-primary'
                    }`}
                  >
                    {delivery.reference}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-outline" />
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {formatDate(delivery.scheduledDate)}
                  </span>
                </div>
                <StatusBadge status={delivery.status} size="sm" />
              </div>

              {/* Destination & Source */}
              <div className="pt-space-xs">
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                  {delivery.toDestination}
                </h4>
                <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-outline">
                    warehouse
                  </span>
                  <span>{delivery.fromLocation}</span>
                </div>
              </div>
            </div>

            {/* Footer row: Contact */}
            <div className="flex items-center justify-between pt-space-md mt-space-md border-t border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center font-label-caps text-[10px] text-primary font-bold">
                  {delivery.contactInitials}
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md font-medium text-on-surface leading-tight">
                    {delivery.contactName}
                  </span>
                  <span className="font-label-code text-label-code text-outline leading-tight text-[11px]">
                    {delivery.contactRole}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {delivery.items.length} item{delivery.items.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
