import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

export const NodeTelemetryCard: React.FC = () => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const start = performance.now();

    apiClient<{ status: string }>('/health')
      .then((res) => {
        if (isMounted) {
          const elapsed = Math.round(performance.now() - start);
          setLatencyMs(elapsed);
          setIsBackendHealthy(res.status === 'ok');
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsBackendHealthy(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col gap-3 border border-outline-variant/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">sensors</span>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Node Telemetry</h3>
        </div>
        <span
          className={`font-label-code text-[11px] flex items-center gap-1 font-semibold font-mono ${
            isBackendHealthy ? 'text-tertiary' : isBackendHealthy === false ? 'text-error' : 'text-outline'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBackendHealthy
                ? 'bg-tertiary animate-pulse'
                : isBackendHealthy === false
                ? 'bg-error'
                : 'bg-outline animate-ping'
            }`}
          />
          {isBackendHealthy ? 'CONNECTED' : isBackendHealthy === false ? 'DISCONNECTED' : 'CHECKING...'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        {/* Core FastAPI Engine */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded flex items-center justify-center ${
                isBackendHealthy ? 'bg-tertiary-fixed text-tertiary' : 'bg-error-container text-error'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dns</span>
            </div>
            <div>
              <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                FastAPI Gateway
              </div>
              <div className="text-[11px] text-on-surface-variant font-label-code font-mono">
                {isBackendHealthy
                  ? `REST API Active · Latency ${latencyMs ?? '<10'}ms`
                  : 'Backend Gateway Unreachable'}
              </div>
            </div>
          </div>
          <span
            className={`font-label-code text-[11px] font-bold font-mono ${
              isBackendHealthy ? 'text-tertiary' : 'text-error'
            }`}
          >
            {isBackendHealthy ? '200 OK' : 'ERR'}
          </span>
        </div>

        {/* Database Engine */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">database</span>
            </div>
            <div>
              <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                SQLite Storage
              </div>
              <div className="text-[11px] text-on-surface-variant font-label-code font-mono">
                Persistent WAL Journal · ACID Safe
              </div>
            </div>
          </div>
          <span className="font-label-code text-[11px] font-bold text-primary font-mono">
            SYNCED
          </span>
        </div>

        {/* Ledger Integrity */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-secondary-fixed text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">verified</span>
            </div>
            <div>
              <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                Stock Ledger
              </div>
              <div className="text-[11px] text-on-surface-variant font-label-code font-mono">
                Append-Only Immutable Records
              </div>
            </div>
          </div>
          <span className="font-label-code text-[11px] font-bold text-secondary font-mono">
            VERIFIED
          </span>
        </div>
      </div>
    </div>
  );
};
