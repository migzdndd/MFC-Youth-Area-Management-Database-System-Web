import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

export interface EmailVerificationFieldProps {
  email: string;
  onChangeEmail: (email: string) => void;
  isVerified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  disabled?: boolean;
  onBeforeSend?: () => void;
  notification?: string | null;
  notificationType?: 'info' | 'success' | 'error';
  onNotificationChange?: (msg: string | null, type: 'info' | 'success' | 'error') => void;
}

const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

/**
 * Modular Email Verification Field with inline code entry and status notification
 */
export const EmailVerificationField: React.FC<EmailVerificationFieldProps> = ({
  email,
  onChangeEmail,
  isVerified,
  onVerifiedChange,
  disabled = false,
  onBeforeSend,
  notification,
  notificationType = 'info',
  onNotificationChange,
}) => {
  const toast = useToast();

  const [isSending, setIsSending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [inlineOtpCode, setInlineOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [inlineOtpError, setInlineOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleSendVerification = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      onNotificationChange?.('Enter a valid email address first.', 'error');
      return;
    }

    setIsSending(true);
    setInlineOtpError('');
    onNotificationChange?.(null, 'info');
    onBeforeSend?.();

    try {
      const res = await apiClient<{ ok: boolean; message?: string; error?: string }>('/auth/send-verification', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (!res.ok) {
        throw new Error(res.message || res.error || 'Failed to dispatch verification email.');
      }

      setVerificationSent(true);
      setResendCountdown(60);
      onNotificationChange?.(
        'Verification email sent. Please check your inbox and spam folder for the confirmation link or 6-digit code.',
        'info'
      );
      toast.success('Verification email sent', 'Check your inbox and spam folder');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification email. Please try again.';
      onNotificationChange?.(msg, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyInlineOtp = async () => {
    const cleanCode = inlineOtpCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setInlineOtpError('Enter the 6-digit code from your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setInlineOtpError('');

    try {
      const res = await apiClient<{ ok: boolean; verified?: boolean; message?: string; error?: string }>(
        '/auth/verify-email',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            token: cleanCode,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(res.message || res.error || 'Invalid verification code. Please check your email.');
      }

      onVerifiedChange(true);
      setVerificationSent(false);
      setInlineOtpCode('');
      onNotificationChange?.('Email is verified. You can now continue your registration.', 'success');
      toast.success('Email verified successfully!', 'Verified');
    } catch (err: unknown) {
      setInlineOtpError(err instanceof Error ? err.message : 'Verification failed. Check the code and try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor="reg-email" className="block text-xs font-semibold text-text-main">
        Email Address <span className="text-mfc-red">*</span>
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            placeholder="servant@example.com"
            value={email}
            onChange={(e) => {
              onChangeEmail(e.target.value);
              if (isVerified) {
                onVerifiedChange(false);
                onNotificationChange?.(null, 'info');
              }
            }}
            readOnly={isVerified}
            disabled={disabled || isSending}
            className={`w-full h-11 px-3.5 text-sm rounded-lg border transition-all focus:outline-none ${
              isVerified
                ? 'bg-emerald-50/50 border-emerald-300 text-slate-800 pr-9'
                : 'bg-white border-border-strong text-slate-900 focus:border-navy focus:ring-1 focus:ring-navy'
            }`}
          />
          {isVerified && (
            <CheckCircle2
              className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          )}
        </div>

        {isVerified ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Verified</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onVerifiedChange(false);
                onNotificationChange?.(null, 'info');
                setVerificationSent(false);
              }}
              className="text-xs text-text-muted hover:text-navy underline h-11 px-2 transition-colors cursor-pointer"
            >
              Change
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSendVerification}
            disabled={disabled || isSending || !email.trim() || !isValidEmail(email)}
            isLoading={isSending}
            className="h-11 px-4 text-xs font-semibold shrink-0 min-h-[44px]"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            <span>{verificationSent ? 'Resend' : 'Verify'}</span>
          </Button>
        )}
      </div>

      {/* Status Notification Below Email Input */}
      {notification && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
            notificationType === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notificationType === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {notificationType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          ) : notificationType === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <Mail className="w-4 h-4 text-navy shrink-0 mt-0.5" aria-hidden="true" />
          )}

          <div className="flex-1 leading-relaxed">
            <p className="font-medium">{notification}</p>

            {/* Inline 6-Digit Code Entry */}
            {verificationSent && !isVerified && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-800 block">
                  Received the 6-digit code? Enter it below:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={inlineOtpCode}
                    onChange={(e) => setInlineOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-28 h-9 px-2.5 text-center text-sm font-mono tracking-widest rounded border border-slate-300 bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleVerifyInlineOtp}
                    disabled={isVerifyingOtp || inlineOtpCode.length < 4}
                    isLoading={isVerifyingOtp}
                    className="h-9 px-3 text-xs"
                  >
                    Confirm Code
                  </Button>
                  {resendCountdown > 0 && (
                    <span className="text-[11px] text-text-muted">
                      Resend in {resendCountdown}s
                    </span>
                  )}
                </div>
                {inlineOtpError && (
                  <p className="text-[11px] text-mfc-red font-medium">{inlineOtpError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
