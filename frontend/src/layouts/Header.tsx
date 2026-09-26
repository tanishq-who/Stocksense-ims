import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOperationsOpen, setIsOperationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isOperationsActive = location.pathname.startsWith('/operations') || location.pathname === '/';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-space-md py-space-xs rounded-lg font-body-md text-body-md transition-colors ${
      isActive
        ? 'bg-primary-container text-on-primary font-medium shadow-sm'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1600px] mx-auto px-margin h-16 flex items-center justify-between gap-space-lg">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-space-xl">
          {/* Brand Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-space-sm group">
            {/* SVG Logo icon matching StockSense brand colors */}
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <span className="font-headline-md text-headline-md tracking-tight text-on-surface font-bold">
              StockSense
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-space-xs relative">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>

            {/* Operations Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsOperationsOpen(true)}
              onMouseLeave={() => setIsOperationsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsOperationsOpen((prev) => !prev)}
                className={`px-space-md py-space-xs rounded-lg font-body-md text-body-md transition-colors flex items-center gap-1 ${
                  isOperationsActive
                    ? 'bg-primary-container text-on-primary font-medium shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>Operations</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>

              {/* Sub-menu flyout */}
              {isOperationsOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg py-1 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 font-label-caps text-[10px] text-outline uppercase tracking-wider">
                    Warehouse Actions
                  </div>
                  <NavLink
                    to="/operations/deliveries"
                    onClick={() => setIsOperationsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2 flex items-center gap-2 text-body-md transition-colors ${
                        isActive
                          ? 'bg-surface-container text-primary font-medium'
                          : 'text-on-surface hover:bg-surface-container-low'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      local_shipping
                    </span>
                    <div>
                      <div className="font-medium leading-none">Delivery</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Outbound dispatch</div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/operations/receipts"
                    onClick={() => setIsOperationsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2 flex items-center gap-2 text-body-md transition-colors ${
                        isActive
                          ? 'bg-surface-container text-primary font-medium'
                          : 'text-on-surface hover:bg-surface-container-low'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      call_received
                    </span>
                    <div>
                      <div className="font-medium leading-none">Receipts</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Inbound shipments</div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/operations/transfers"
                    onClick={() => setIsOperationsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2 flex items-center gap-2 text-body-md transition-colors ${
                        isActive
                          ? 'bg-surface-container text-primary font-medium'
                          : 'text-on-surface hover:bg-surface-container-low'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px] text-tertiary">
                      swap_horiz
                    </span>
                    <div>
                      <div className="font-medium leading-none">Internal Transfers</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Between bays & zones</div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/operations/adjustments"
                    onClick={() => setIsOperationsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2 flex items-center gap-2 text-body-md transition-colors ${
                        isActive
                          ? 'bg-surface-container text-primary font-medium'
                          : 'text-on-surface hover:bg-surface-container-low'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px] text-outline">
                      rule
                    </span>
                    <div>
                      <div className="font-medium leading-none">Inventory Adjustments</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Stock reconciliation</div>
                    </div>
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>
            <NavLink to="/move-history" className={navLinkClass}>
              Move History
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              Settings
            </NavLink>
          </nav>
        </div>

        {/* Right: Notifications, Warehouse Badge, User Profile */}
        <div className="flex items-center gap-space-md">
          {/* Notifications Button */}
          <button
            type="button"
            aria-label="Notifications"
            className="p-space-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors relative"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
          </button>

          <div className="h-5 w-px bg-outline-variant/40 hidden sm:block" />

          {/* Warehouse Active Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full border border-tertiary-container/30 bg-tertiary-fixed/30 text-tertiary font-label-caps text-label-caps uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            <span>Warehouse Active</span>
          </div>

          {/* User Profile Avatar with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-space-sm pl-space-xs focus:outline-none rounded-lg hover:bg-surface-container-low p-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-semibold text-xs ring-1 ring-outline-variant/40">
                {getInitials(user?.name)}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="font-body-sm text-body-sm font-medium text-on-surface leading-tight">
                  {user?.name || 'Warehouse Operator'}
                </span>
                <span className="font-label-code text-label-code text-on-surface-variant leading-tight text-[11px]">
                  ID #{user?.id ?? '—'} &middot; Operator
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg py-1.5 z-50">
                <div className="px-3 py-2 border-b border-surface-container mb-1">
                  <div className="font-medium text-on-surface text-body-sm truncate">
                    {user?.name || 'Warehouse Operator'}
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-mono truncate">
                    {user?.email || 'operator@stocksense.io'}
                  </div>
                </div>
                <NavLink
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="px-3 py-1.5 text-body-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">person</span>
                  <span>My Profile</span>
                </NavLink>
                <NavLink
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="px-3 py-1.5 text-body-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">settings</span>
                  <span>Settings</span>
                </NavLink>
                <div className="border-t border-surface-container my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-1.5 text-body-sm text-error hover:bg-surface-container flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
