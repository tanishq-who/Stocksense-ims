import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../api/authService';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEmail = searchParams.get('email') || '';
  const initialCode = searchParams.get('code') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!cleanOtp) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }
    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('OTP must be exactly 6 numeric digits.');
      return;
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setErrorMessage(pwdError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please verify both fields.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.verifyPasswordReset({
        email: cleanEmail,
        otp: cleanOtp,
        new_password: newPassword,
      });

      setSuccessMessage(
        res.message || 'Password updated successfully. You can now sign in with your new credentials.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify OTP or update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Verify your 6-digit OTP and establish new account credentials."
    >
      {successMessage ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="p-4 bg-tertiary-fixed/30 border border-tertiary/20 rounded-xl text-on-surface text-body-md">
            <div className="flex items-center gap-2 text-tertiary font-semibold mb-1">
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
              <span>Credentials Updated</span>
            </div>
            <p className="text-on-surface-variant text-body-sm leading-relaxed">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-white font-medium rounded-xl shadow-sm shadow-primary/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Proceed to Sign In</span>
            <span className="material-symbols-outlined text-[18px]">login</span>
          </button>
        </div>
      ) : (
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

          {/* Email Address */}
          <div>
            <label
              htmlFor="email"
              className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
            >
              Registered Email
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

          {/* OTP Code Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="otp"
                className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
              >
                6-Digit Verification Code (OTP)
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-primary hover:text-primary-container"
              >
                Resend code
              </Link>
            </div>
            <div className="relative">
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                autoComplete="one-time-code"
                required
                disabled={isLoading}
                value={otp}
                onChange={(e) => {
                  // Only allow numbers
                  const val = e.target.value.replace(/\D/g, '');
                  setOtp(val);
                }}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/40 text-on-surface placeholder:text-outline/50 font-mono text-center tracking-[0.4em] text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60"
              />
              <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-[20px] text-outline/50 pointer-events-none">
                pin
              </span>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
            >
              Confirm New Password
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
            {confirmPassword && newPassword !== confirmPassword && (
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
                  <span>Verifying &amp; Updating...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Footer Navigation */}
      <div className="mt-6 pt-5 border-t border-outline-variant/30 text-center">
        <p className="text-body-sm text-on-surface-variant">
          Remember your password?{' '}
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
