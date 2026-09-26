import React from 'react';
import { DeliveryStatus } from '../../types/delivery';

interface StatusBadgeProps {
  status: DeliveryStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'Ready':
        return {
          badge: 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]',
          dot: 'bg-[#10b981]',
          icon: null,
        };
      case 'Waiting':
        return {
          badge: 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]',
          dot: 'bg-[#f59e0b]',
          icon: null,
        };
      case 'Draft':
        return {
          badge: 'bg-[#f1f5f9] border-[#cbd5e1] text-[#475569]',
          dot: 'bg-[#94a3b8]',
          icon: null,
        };
      case 'Done':
        return {
          badge: 'bg-[#eef2ff] border-[#c7d2fe] text-[#4338ca]',
          dot: null,
          icon: 'check',
        };
      case 'Canceled':
        return {
          badge: 'bg-[#fff1f2] border-[#fecdd3] text-[#be123c]',
          dot: 'bg-[#f43f5e]',
          icon: null,
        };
      default:
        return {
          badge: 'bg-surface-container border-outline-variant text-on-surface-variant',
          dot: 'bg-outline',
          icon: null,
        };
    }
  };

  const { badge, dot, icon } = getStyles();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-label-caps font-semibold uppercase tracking-wider select-none ${sizeClasses} ${badge}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {icon && <span className="material-symbols-outlined text-[13px]">{icon}</span>}
      <span>{status}</span>
    </span>
  );
};
