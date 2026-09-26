import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated and not loading, redirect to target or dashboard
  if (!authLoading && isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setIsLoading(true);
      await login({
        email: cleanEmail,
        password,
      });

      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to StockSense"
      subtitle="Access real-time inventory management, stock levels, and operations."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-error-container/60 border border-error/30 rounded-xl text-on-error-container text-body-sm flex items-start gap-2.5 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-[18px] text-error flex-shrink-0 mt-0.5">
              error
            </span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@stocksense.io"
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/40 text-on-surface placeholder:text-outline/50 font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60"
            />
            <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-[20px] text-outline/50 pointer-events-none">
              mail
            </span>
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[12px] font-medium text-primary hover:text-primary-container transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/40 text-on-surface placeholder:text-outline/50 font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="material-symbols-outlined absolute right-3.5 top-2.5 text-[20px] text-outline/60 hover:text-on-surface transition-colors"
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-white font-medium rounded-xl shadow-sm shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 pt-5 border-t border-outline-variant/30 text-center">
        <p className="text-body-sm text-on-surface-variant">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary hover:text-primary-container transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
