import React, { useState } from 'react';
import { Delivery } from '../../types/delivery';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/formatters';

interface DeliveryTableProps {
  deliveries: Delivery[];
  onSelectDelivery?: (delivery: Delivery) => void;
  onStatusChange?: (deliveryId: string, newStatus: any) => void;
}

export const DeliveryTable: React.FC<DeliveryTableProps> = ({
  deliveries,
  onSelectDelivery,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(deliveries.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllSelected = deliveries.length > 0 && selectedIds.length === deliveries.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < deliveries.length;

  return (
    <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all border border-outline-variant/30">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider h-10 select-none border-b border-outline-variant/20">
              <th className="w-10 px-4 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  aria-label="Select all rows"
                />
              </th>
              <th className="px-space-md py-2 font-semibold">Reference</th>
              <th className="px-space-md py-2 font-semibold">From</th>
              <th className="px-space-md py-2 font-semibold">To Destination</th>
              <th className="px-space-md py-2 font-semibold">Contact / Handler</th>
              <th className="px-space-md py-2 font-semibold">Scheduled Date</th>
              <th className="px-space-md py-2 font-semibold">Status</th>
              <th className="w-12 px-space-md py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container font-body-md text-body-md text-on-surface">
            {deliveries.map((delivery) => {
              const isChecked = selectedIds.includes(delivery.id);
              const isCanceled = delivery.status === 'Canceled';

              return (
                <tr
                  key={delivery.id}
                  onClick={() => onSelectDelivery?.(delivery)}
                  className={`hover:bg-surface-container-low/70 transition-colors group cursor-pointer ${
                    isCanceled ? 'opacity-80 hover:opacity-100' : ''
                  }`}
                >
                  <td
                    className="w-10 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSelectRow(delivery.id, e.target.checked)}
                      className="row-checkbox w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      aria-label={`Select ${delivery.reference}`}
                    />
                  </td>

                  {/* Reference Column */}
                  <td className="px-space-md py-3 font-label-code text-label-code font-semibold">
                    <span
                      className={`flex items-center gap-1 font-mono ${
                        isCanceled
                          ? 'line-through text-on-surface-variant'
                          : 'text-primary hover:underline'
                      }`}
                    >
                      <span>{delivery.reference}</span>
                      <span className="material-symbols-outlined text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">
                        open_in_new
                      </span>
                    </span>
                  </td>

                  {/* From Column */}
                  <td className="px-space-md py-3">
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-outline">
                        warehouse
                      </span>
                      <span className="font-medium">{delivery.fromLocation}</span>
                    </div>
                  </td>

                  {/* To Destination Column */}
                  <td className="px-space-md py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">
                        pin_drop
                      </span>
                      <span className={isCanceled ? 'line-through text-on-surface-variant' : ''}>
                        {delivery.toDestination}
                      </span>
                    </div>
                  </td>

                  {/* Contact / Handler Column */}
                  <td className="px-space-md py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center font-label-caps text-[10px] text-primary font-bold">
                        {delivery.contactInitials}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-medium leading-tight ${isCanceled ? 'text-on-surface-variant' : ''}`}>
                          {delivery.contactName}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                          {delivery.contactRole}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Scheduled Date Column */}
                  <td className="px-space-md py-3 text-on-surface font-label-code text-label-code font-mono tabular-nums">
                    {formatDate(delivery.scheduledDate)}
                  </td>

                  {/* Status Column */}
                  <td className="px-space-md py-3">
                    <StatusBadge status={delivery.status} />
                  </td>

                  {/* Actions Column */}
                  <td
                    className="px-space-md py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                      title="Options"
                      aria-label="Options"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
