import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordResetRequestResponse } from '../types/auth';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<PasswordResetRequestResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessResponse(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.requestPasswordReset({ email: cleanEmail });
      setSuccessResponse(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToReset = () => {
    const code = successResponse?.dev_otp || successResponse?.otp || '';
    const query = new URLSearchParams();
    query.set('email', email.trim());
    if (code) {
      query.set('code', code);
    }
    navigate(`/reset-password?${query.toString()}`);
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to generate a secure 6-digit verification code."
    >
      {successResponse ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Success Notification */}
          <div className="p-4 bg-tertiary-fixed/30 border border-tertiary/20 rounded-xl text-on-surface text-body-md">
            <div className="flex items-center gap-2 text-tertiary font-semibold mb-1">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Code Dispatched Successfully</span>
            </div>
            <p className="text-on-surface-variant text-body-sm leading-relaxed">
              {successResponse.message}
            </p>
            <p className="mt-2 text-[11px] text-outline font-medium">
              Validity window: {successResponse.expires_in_minutes} minutes
            </p>
          </div>

          {/* Development Testing OTP banner if available */}
          {(successResponse.dev_otp || successResponse.otp) && (
            <div className="p-3.5 bg-primary-fixed/40 border border-primary/20 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-primary tracking-wider uppercase font-label-caps flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">terminal</span>
                  Dev Environment OTP
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-white font-mono">
                  Local Dev
                </span>
              </div>
              <div className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">
                <span className="font-mono text-lg font-bold tracking-widest text-primary">
                  {successResponse.dev_otp || successResponse.otp}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      successResponse.dev_otp || successResponse.otp || ''
                    );
                  }}
                  className="px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary-fixed rounded transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Proceed Button */}
          <button
            type="button"
            onClick={handleProceedToReset}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-white font-medium rounded-xl shadow-sm shadow-primary/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Enter OTP &amp; Reset Password</span>
            <span className="material-symbols-outlined text-[18px]">key</span>
          </button>

          {/* Back button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setSuccessResponse(null);
              }}
              className="text-body-sm text-outline hover:text-on-surface transition-colors"
            >
              Request another code with a different email
            </button>
          </div>
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

          {/* Email input */}
          <div>
            <label
              htmlFor="email"
              className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5"
            >
              Registered Email Address
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
            <p className="mt-1.5 text-[11px] text-on-surface-variant">
              A 6-digit one-time password (valid for 10 minutes) will be generated for this account.
            </p>
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
                  <span>Generating Code...</span>
                </>
              ) : (
                <>
                  <span>Request Reset OTP</span>
                  <span className="material-symbols-outlined text-[18px]">send</span>
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
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
