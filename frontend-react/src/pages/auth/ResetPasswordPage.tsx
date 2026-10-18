import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [recoveryData] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        accessToken: null,
        refreshToken: null,
        tokenHash: null,
        hasValidToken: false,
      };
    }

    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const hashAccessToken = hashParams.get('access_token');
    const hashRefreshToken = hashParams.get('refresh_token');
    const hashTokenHash = hashParams.get('token_hash');

    const searchParams = new URLSearchParams(window.location.search);
    const queryTokenHash = searchParams.get('token_hash');
    const queryCode = searchParams.get('code');

    const accessToken = hashAccessToken;
    const refreshToken = hashRefreshToken;
    const tokenHash = hashTokenHash || queryTokenHash || queryCode;
    const hasValidToken = Boolean(accessToken || tokenHash);

    return {
      accessToken,
      refreshToken,
      tokenHash,
      hasValidToken,
    };
  });

  const { hasValidToken } = recoveryData;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = (): boolean => {
    const errors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      errors.newPassword = 'Password is required.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long.';
    } else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one letter and one number.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const payload: Record<string, string> = {
        newPassword,
      };
      if (recoveryData.tokenHash) payload.token_hash = recoveryData.tokenHash;
      if (recoveryData.accessToken) payload.access_token = recoveryData.accessToken;
      if (recoveryData.refreshToken) payload.refresh_token = recoveryData.refreshToken;

      const res = await apiClient<{ ok: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSuccess(true);
        // Clear sensitive token from browser address bar
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname);
        }
        toast.success('Password updated successfully!', 'You can now sign in.');
      } else {
        setServerError(res.message || 'Unable to reset password. The link may have expired.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred while resetting your password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-navy"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
          <img src="/img/logo-2.png" alt="MFC Youth" width={32} height={32} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <KeyRound className="w-3.5 h-3.5 text-navy" />
            <span>Account Security</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Create New Password
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Choose a strong password to protect your servant account.
          </p>
        </div>

        {hasValidToken === false && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 space-y-1">
                <p className="font-semibold">Invalid or Expired Link</p>
                <p className="text-xs text-amber-700">
                  This password recovery link is missing or has expired. Please request a new recovery link.
                </p>
              </div>
            </div>
            <Link to="/forgot-password" className="block">
              <Button variant="primary" size="lg" className="w-full">
                Request New Recovery Link
              </Button>
            </Link>
          </div>
        )}

        {isSuccess && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text-main">Password Updated</h2>
              <p className="text-xs text-text-muted">
                Your password has been changed successfully. You may now sign in with your new credentials.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              onClick={() => navigate('/login', { replace: true })}
            >
              Proceed to Sign In
            </Button>
          </div>
        )}

        {hasValidToken && !isSuccess && (
          <>
            {serverError && (
              <div
                className="p-3 text-sm text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <Input
                label="New Password"
                type="password"
                name="new_password"
                id="reset-new-password"
                required
                autoComplete="new-password"
                preventAutofill
                disableCopyPaste
                placeholder="At least 8 chars with letter & number"
                value={newPassword}
                error={fieldErrors.newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="confirm_new_password"
                id="reset-confirm-password"
                required
                autoComplete="new-password"
                preventAutofill
                disableCopyPaste
                placeholder="Re-enter your new password"
                value={confirmPassword}
                error={fieldErrors.confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
              />

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                <span>Password must be at least 8 characters long and contain both letters and numbers.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Reset Password
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
