import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserCheck, ArrowLeft } from 'lucide-react';
import { MemberClaimWizardModal } from '@/components/auth/MemberClaimWizardModal';
import type { UserProfile } from '@/types/auth';

const REMEMBERED_MEMBER_EMAIL_KEY = 'mfc_remembered_member_email';
const MEMBER_EMAIL_DRAFT_KEY = 'mfc_member_email_draft';

export const MemberLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_MEMBER_EMAIL_KEY) || sessionStorage.getItem(MEMBER_EMAIL_DRAFT_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      const stored = localStorage.getItem(REMEMBERED_MEMBER_EMAIL_KEY);
      return Boolean(stored && stored.trim().length > 0);
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    try {
      sessionStorage.setItem(MEMBER_EMAIL_DRAFT_KEY, val);
      if (rememberMe) {
        if (val.trim()) {
          localStorage.setItem(REMEMBERED_MEMBER_EMAIL_KEY, val.trim());
        } else {
          localStorage.removeItem(REMEMBERED_MEMBER_EMAIL_KEY);
        }
      }
    } catch {
      // Storage restricted mode fallback
    }
  };

  const handleRememberChange = (checked: boolean) => {
    setRememberMe(checked);
    try {
      if (checked) {
        if (email.trim()) {
          localStorage.setItem(REMEMBERED_MEMBER_EMAIL_KEY, email.trim());
        }
      } else {
        localStorage.removeItem(REMEMBERED_MEMBER_EMAIL_KEY);
      }
    } catch {
      // Storage restricted mode fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Warm destination bundle while member auth request is in flight
    prefetchDestinations();

    try {
      const res = await apiClient<{
        ok?: boolean;
        access_token?: string;
        refresh_token?: string;
        session?: {
          accessToken?: string;
          refreshToken?: string;
          access_token?: string;
          refresh_token?: string;
        };
        user?: {
          id: string;
          email: string;
          role?: string;
          area_id?: string;
          areaId?: string;
          chapter_id?: string | null;
          chapterId?: string | null;
          member_id?: string | null;
          memberId?: string | null;
          name?: string;
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          area_name?: string;
          areaName?: string;
          is_developer?: boolean;
        };
        error?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, portal: 'member', remember: rememberMe }),
      });

      const accessToken = res.access_token || res.session?.accessToken || res.session?.access_token;
      const refreshToken = res.refresh_token || res.session?.refreshToken || res.session?.refresh_token || '';

      if (accessToken && res.user) {
        const rawUser = res.user;
        const normalizedUser: UserProfile = {
          id: rawUser.id,
          email: rawUser.email,
          role: (rawUser.role as UserProfile['role']) || 'member',
          area_id: rawUser.area_id || rawUser.areaId || '',
          area_name: rawUser.area_name || rawUser.areaName,
          chapter_id: rawUser.chapter_id || rawUser.chapterId || null,
          member_id: rawUser.member_id || rawUser.memberId || null,
          first_name: rawUser.first_name || (rawUser.name ? rawUser.name.split(' ')[0] : ''),
          middle_name: rawUser.middle_name || null,
          last_name: rawUser.last_name || (rawUser.name ? rawUser.name.split(' ').slice(1).join(' ') : ''),
          is_developer: Boolean(rawUser.is_developer),
        };

        setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
          user: normalizedUser,
        }, rememberMe);

        try {
          sessionStorage.removeItem(MEMBER_EMAIL_DRAFT_KEY);
          if (rememberMe && email.trim()) {
            localStorage.setItem(REMEMBERED_MEMBER_EMAIL_KEY, email.trim());
          } else {
            localStorage.removeItem(REMEMBERED_MEMBER_EMAIL_KEY);
          }
        } catch {
          // Storage restricted mode fallback
        }

        navigate('/member');
      } else {
        setErrorMessage(res.error || 'Invalid credentials for Member Portal.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to sign in. Please verify your member credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const prefetchDestinations = () => {
    import('@/pages/MemberPortalPage');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-2xl shadow-md p-6 sm:p-8 space-y-6 animate-page-enter">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <Link to="/login" className="group inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-navy transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-150" />
            <span>Leader Portal</span>
          </Link>
          <img src="/img/logo-2.png" alt="MFC Youth" width={32} height={32} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-semibold mb-2 border border-amber-200/80">
            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>MFC Youth Member Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
            Youth Member Sign In
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Access your registered gatherings, pastoral profile, and personal GIG records.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 text-sm text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium" role="alert">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onFocusCapture={prefetchDestinations}
          onMouseEnter={prefetchDestinations}
          autoComplete="off"
          className="space-y-4"
        >
          <Input
            label="Member Email"
            type="email"
            name="mfc_member_email"
            id="member-email"
            required
            autoComplete="off"
            preventAutofill
            disableCopyPaste
            onBlockedClipboard={(action) => {
              toast.error('Action blocked', `${action === 'paste' ? 'Pasting into' : 'Copying from'} email is disabled for credential security.`);
            }}
            placeholder="member@example.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            name="mfc_member_password"
            id="member-password"
            required
            autoComplete="new-password"
            preventAutofill
            disableCopyPaste
            onBlockedClipboard={(action) => {
              toast.error('Action blocked', `${action === 'paste' ? 'Pasting into' : 'Copying from'} password is disabled for credential security.`);
            }}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between text-sm pt-1">
            <label htmlFor="member-remember-me" className="flex items-center gap-2 cursor-pointer select-none min-h-[44px] py-1">
              <input
                id="member-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => handleRememberChange(e.target.checked)}
                className="rounded border-slate-300 text-navy focus:ring-navy w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-text-muted font-medium">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-navy hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Sign In to Member Portal
          </Button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-xs text-text-muted mb-2">First time accessing your record?</p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setIsClaimModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <UserCheck className="w-4 h-4 text-navy" />
            <span>Claim Your Youth Profile</span>
          </Button>
        </div>

        <div className="pt-4 border-t border-border-subtle text-center text-xs text-text-muted">
          <span>Are you a Servant Leader? </span>
          <Link to="/login" className="font-bold text-navy hover:underline">
            Leader Portal Sign In &rarr;
          </Link>
        </div>
      </div>

      {isClaimModalOpen && (
        <MemberClaimWizardModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
        />
      )}
    </div>
  );
};
