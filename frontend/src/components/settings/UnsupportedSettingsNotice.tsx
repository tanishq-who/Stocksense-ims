import React from 'react';

interface UnsupportedSettingsNoticeProps {
  title: string;
  category: 'preferences' | 'notifications';
}

export const UnsupportedSettingsNotice: React.FC<UnsupportedSettingsNoticeProps> = ({
  title,
  category,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-sm text-center max-w-2xl mx-auto space-y-4">
      <div className="w-16 h-16 rounded-full bg-surface-container-high text-outline flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-[32px]">
          {category === 'preferences' ? 'tune' : 'notifications_paused'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
            {title}
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-label-caps text-[11px] font-bold uppercase tracking-wider">
            Backend API Required
          </span>
        </div>
        <p className="text-body-md text-on-surface-variant max-w-lg mx-auto">
          {category === 'preferences'
            ? 'Inventory preferences, default valuation methods (FIFO/AVCO), barcode scan behaviors, and unit conversion rules require dedicated persistence endpoints in the FastAPI backend.'
            : 'Alert dispatching channels (SMS, Webhooks, Telegram, Email) and automated threshold telemetry require notification route configurations in the FastAPI backend.'}
        </p>
      </div>

      <div className="p-4 bg-surface-container-low rounded-lg text-left border border-outline-variant/20 text-body-sm text-on-surface-variant space-y-2 font-mono text-[12px]">
        <div className="flex items-center gap-2 font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[16px] text-amber-600">info</span>
          <span>Zero-Mock Integrity Policy:</span>
        </div>
        <p>
          In accordance with StockSense architecture guidelines, static JSON or temporary local storage is disabled to prevent data divergence. These controls will be enabled once backend endpoints are published.
        </p>
      </div>
    </div>
  );
};
