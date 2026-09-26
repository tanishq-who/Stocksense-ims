import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center">
          <Link to="/" className="flex items-center gap-space-sm group mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <span className="font-headline-xl text-headline-xl tracking-tight text-on-surface font-bold">
              StockSense
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-tertiary-container/30 bg-tertiary-fixed/30 text-tertiary font-label-caps text-label-caps uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            <span>Warehouse OS &middot; Secure Core</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface text-center tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-center font-body-md text-body-md text-on-surface-variant max-w-sm">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 border border-outline-variant/30 rounded-2xl shadow-sm">
          {children}
        </div>

        {/* Security & Ledger footnote */}
        <div className="mt-6 text-center text-[12px] text-on-surface-variant flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
          <span>FastAPI Bearer Auth &middot; Cryptographic OTP &middot; Immutable Ledger</span>
        </div>
      </div>
    </div>
  );
};
