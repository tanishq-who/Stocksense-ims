import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[20px] text-primary">account_circle</span>
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-outline">
            Account Management
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface">Operator Profile</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Authenticated credentials, role authorization, and security session telemetry.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md shadow-primary/20 ring-4 ring-primary-fixed/40">
              {getInitials(user?.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  {user?.name || 'Warehouse Operator'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-tertiary-fixed/40 text-tertiary border border-tertiary/20">
                  Active
                </span>
              </div>
              <p className="text-body-md text-on-surface-variant font-mono mt-0.5">{user?.email}</p>
              <div className="text-[12px] text-outline mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">badge</span>
                <span>User ID #{user?.id}</span>
                <span className="text-outline-variant">&bull;</span>
                <span>Member since {user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error font-medium rounded-xl text-body-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>

        {/* Security & Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <div className="flex items-center gap-2 text-primary font-medium text-body-sm mb-1">
              <span className="material-symbols-outlined text-[18px]">key</span>
              <span>Authentication Token</span>
            </div>
            <div className="text-headline-sm font-semibold text-on-surface mt-1">Bearer JWT</div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              FastAPI HS256 cryptographically signed session token.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <div className="flex items-center gap-2 text-secondary font-medium text-body-sm mb-1">
              <span className="material-symbols-outlined text-[18px]">shield</span>
              <span>Ledger Authorization</span>
            </div>
            <div className="text-headline-sm font-semibold text-on-surface mt-1">Full Operations</div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Receipts, Deliveries, Transfers, and Stock Reconciliation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <div className="flex items-center gap-2 text-tertiary font-medium text-body-sm mb-1">
              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              <span>Credential Recovery</span>
            </div>
            <div className="text-headline-sm font-semibold text-on-surface mt-1">6-Digit OTP</div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Time-bound (10-minute expiry) bcrypt-hashed OTP verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
