import React from 'react';

export type UiState = 'live' | 'loading' | 'empty' | 'error';

interface StateInspectorProps {
  currentState: UiState;
  onStateChange: (state: UiState) => void;
}

export const StateInspector: React.FC<StateInspectorProps> = ({ currentState, onStateChange }) => {
  const states: { id: UiState; label: string }[] = [
    { id: 'live', label: 'Live' },
    { id: 'loading', label: 'Loading' },
    { id: 'empty', label: 'Empty' },
    { id: 'error', label: 'Error' },
  ];

  return (
    <div className="mb-space-lg p-space-sm bg-surface-container rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-sm">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">State Inspector</span>
        <span className="bg-primary-fixed text-on-primary-fixed-variant px-space-xs py-0.5 rounded text-label-caps font-label-caps uppercase tracking-wider font-semibold">
          Interactive Demo
        </span>
        <span className="text-body-sm font-body-sm text-on-surface-variant hidden sm:inline">
          Preview system visual feedback & lifecycle states
        </span>
      </div>

      <div className="inline-flex p-0.5 bg-surface-container-highest rounded-lg gap-0.5">
        {states.map(({ id, label }) => {
          const isActive = currentState === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onStateChange(id)}
              className={`px-space-md py-1 rounded text-body-sm font-body-sm font-medium transition-all ${
                isActive
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
