import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator';

export const SignupPage: React.FC = () => {
  const { signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated and not loading, redirect to dashboard
  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter (a-z).';
    if (!/\d/.test(pwd)) return 'Password must contain at least one numeric digit (0-9).';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address format.');
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setErrorMessage(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    try {
      setIsLoading(true);
      await signup({
        name: cleanName,
        email: cleanEmail,
        password,
      });

      // Redirect to dashboard on successful signup and auto-login
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Account registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Operator Account"
      subtitle="Register a new warehouse operator or manager account on StockSense."
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

        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
          >
            Full Name
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/40 text-on-surface placeholder:text-outline/50 font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60"
            />
            <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-[20px] text-outline/50 pointer-events-none">
              person
            </span>
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="email"
            className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
          >
            Work Email
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
              placeholder="alex@warehouse.io"
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/40 text-on-surface placeholder:text-outline/50 font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60"
            />
            <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-[20px] text-outline/50 pointer-events-none">
              mail
            </span>
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
          {/* Password strength checklist */}
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/40 text-on-surface placeholder:text-outline/50 font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60 pr-10"
            />
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-[11px] text-error flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[13px]">cancel</span>
              Passwords do not match
            </p>
          )}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Register &amp; Launch</span>
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 pt-5 border-t border-outline-variant/30 text-center">
        <p className="text-body-sm text-on-surface-variant">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-container transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
