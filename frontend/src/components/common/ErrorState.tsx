import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  onDiagnostics?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gateway Connection Refused',
  message = 'Failed to load delivery operations data from telemetry hub NODE_04. The warehouse socket connection timed out after 3000ms.',
  onRetry,
  onDiagnostics,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-space-xl py-16 bg-surface-container-lowest rounded-xl shadow-sm text-center border border-outline-variant/30">
      <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mb-space-md">
        <span className="material-symbols-outlined text-[32px]">cloud_off</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mb-1">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
        {message}
      </p>
      <div className="flex items-center gap-space-sm">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm shadow-sm hover:opacity-95 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Retry Handshake</span>
        </button>
        {onDiagnostics && (
          <button
            type="button"
            onClick={onDiagnostics}
            className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md hover:bg-surface-container-high transition-colors"
          >
            View Diagnostics
          </button>
        )}
      </div>
    </div>
  );
};
