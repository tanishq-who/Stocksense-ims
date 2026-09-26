import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbsProps {
  currentSection?: string;
  currentPageTitle?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentSection = 'Operations',
  currentPageTitle = 'Delivery',
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const location = useLocation();

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md pt-2">
      {/* Navigation Breadcrumb trail */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
        <Link to="/dashboard" className="hover:text-on-surface transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-outline">home</span>
          <span>Inventory</span>
        </Link>
        <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
        <span className="hover:text-on-surface transition-colors cursor-pointer">
          {currentSection}
        </span>
        <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
        <span className="font-semibold text-on-surface">
          {currentPageTitle}
        </span>
      </nav>

      {/* Telemetry Node Status */}
      <div className="flex items-center gap-space-sm">
        <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-low shadow-sm border border-outline-variant/20">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          <span className="font-label-code text-label-code text-on-surface font-semibold tracking-wide font-mono">
            NODE_04
          </span>
          <span className="text-body-sm font-body-sm text-on-surface-variant font-normal">
            | Bay 12-Dock C
          </span>
        </div>

        <button
          type="button"
          onClick={handleSync}
          title="Sync Telemetry"
          className="p-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-primary shadow-sm hover:shadow transition-all border border-outline-variant/20"
        >
          <span
            className={`material-symbols-outlined text-[18px] transition-transform duration-500 ${
              isSyncing ? 'rotate-180 text-primary' : ''
            }`}
          >
            sync
          </span>
        </button>
      </div>
    </div>
  );
};
