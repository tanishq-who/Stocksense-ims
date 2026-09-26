import React from 'react';

export const NodeTelemetryCard: React.FC = () => {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col gap-3 border border-outline-variant/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">sensors</span>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Node Telemetry</h3>
        </div>
        <span className="font-label-code text-[11px] text-tertiary flex items-center gap-1 font-semibold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
          SYNCED
        </span>
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        {/* Sensor 1 */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-tertiary-fixed text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">scale</span>
            </div>
            <div>
              <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                Weight Sensors Online
              </div>
              <div className="text-[11px] text-on-surface-variant font-label-code font-mono">
                Dock Gate 3 · Calibration 0.00% err
              </div>
            </div>
          </div>
          <span className="font-label-code text-[11px] font-bold text-tertiary font-mono">98.4%</span>
        </div>

        {/* Sensor 2 */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">barcode_scanner</span>
            </div>
            <div>
              <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                Barcode Scanning Engine
              </div>
              <div className="text-[11px] text-on-surface-variant font-label-code font-mono">
                Latency 38ms · 99.8% precision
              </div>
            </div>
          </div>
          <span className="font-label-code text-[11px] font-bold text-primary font-mono">ACTIVE</span>
        </div>

        {/* Sensor 3 */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-secondary-fixed text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">thermostat</span>
            </div>
            <div>
              <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                Cold Storage Zone A
              </div>
              <div className="text-[11px] text-on-surface-variant font-label-code font-mono">
                Optimal range (2.0°C - 6.0°C)
              </div>
            </div>
          </div>
          <span className="font-label-code text-[11px] font-bold text-secondary font-mono">4.2°C</span>
        </div>
      </div>
    </div>
  );
};
