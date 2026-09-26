import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One numeric digit (0-9)', met: /\d/.test(password) },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  const strengthPercentage = (metCount / criteria.length) * 100;

  const getBarColor = () => {
    if (metCount <= 1) return 'bg-error';
    if (metCount === 2) return 'bg-amber-500';
    if (metCount === 3) return 'bg-blue-500';
    return 'bg-tertiary-container';
  };

  const getStrengthLabel = () => {
    if (password.length === 0) return '';
    if (metCount <= 1) return 'Weak';
    if (metCount === 2) return 'Fair';
    if (metCount === 3) return 'Good';
    return 'Strong';
  };

  if (!password) {
    return (
      <div className="mt-2 text-[11px] text-on-surface-variant flex flex-col gap-1">
        <span>Password must be 8+ chars with uppercase, lowercase, and a number.</span>
      </div>
    );
  }

  return (
    <div className="mt-2.5 p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/30">
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="font-medium text-on-surface-variant">Security Strength:</span>
        <span className={`font-semibold ${metCount === 4 ? 'text-tertiary' : 'text-on-surface'}`}>
          {getStrengthLabel()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-300 rounded-full ${getBarColor()}`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`material-symbols-outlined text-[14px] ${
                c.met ? 'text-tertiary font-bold' : 'text-outline/60'
              }`}
            >
              {c.met ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span className={c.met ? 'text-on-surface font-medium' : 'text-outline'}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
