import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/useToast';
import { apiClient, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDailyReadings } from '@/hooks/useReadings';
import { ShieldCheck, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import type { UserProfile } from '@/types/auth';

const REMEMBERED_LEADER_EMAIL_KEY = 'mfc_remembered_leader_email';
const LEADER_EMAIL_DRAFT_KEY = 'mfc_leader_email_draft';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { setSession } = useAuthStore();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const registrationNotice = location.state?.registered
    ? 'Registration successful! Sign in to select your Area Database and initialize your portal.'
    : '';
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_LEADER_EMAIL_KEY) || sessionStorage.getItem(LEADER_EMAIL_DRAFT_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      const stored = localStorage.getItem(REMEMBERED_LEADER_EMAIL_KEY);
      return Boolean(stored && stored.trim().length > 0);
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailChange = (val: string) => {
    setEmail(val);
    try {
      sessionStorage.setItem(LEADER_EMAIL_DRAFT_KEY, val);
      if (rememberMe) {
        if (val.trim()) {
          localStorage.setItem(REMEMBERED_LEADER_EMAIL_KEY, val.trim());
        } else {
          localStorage.removeItem(REMEMBERED_LEADER_EMAIL_KEY);
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
          localStorage.setItem(REMEMBERED_LEADER_EMAIL_KEY, email.trim());
        }
      } else {
        localStorage.removeItem(REMEMBERED_LEADER_EMAIL_KEY);
      }
    } catch {
      // Storage restricted mode fallback
    }
  };

  const { data: readingsData, isLoading: readingsLoading } = useDailyReadings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Warm destination bundles while auth API request is in flight
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
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });

      const accessToken = res.access_token || res.session?.accessToken || res.session?.access_token;
      const refreshToken = res.refresh_token || res.session?.refreshToken || res.session?.refresh_token || '';

      if (accessToken && res.user) {
        const rawUser = res.user;
        const normalizedUser: UserProfile = {
          id: rawUser.id,
          email: rawUser.email,
          role: (rawUser.role as UserProfile['role']) || 'area_servant',
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
          sessionStorage.removeItem(LEADER_EMAIL_DRAFT_KEY);
          if (rememberMe && email.trim()) {
            localStorage.setItem(REMEMBERED_LEADER_EMAIL_KEY, email.trim());
          } else {
            localStorage.removeItem(REMEMBERED_LEADER_EMAIL_KEY);
          }
        } catch {
          // Storage restricted mode fallback
        }

        queryClient.clear();

        const isServantLeader = normalizedUser.role !== 'member';
        const requiresAreaSelection = Boolean(
          isServantLeader &&
          (!normalizedUser.area_id ||
           normalizedUser.requiresAreaSelection ||
           (res as { requiresAreaSelection?: boolean }).requiresAreaSelection)
        );

        if (requiresAreaSelection) {
          navigate('/select-area');
        } else if (normalizedUser.role === 'member') {
          navigate('/member');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.data as { needsEmailVerification?: boolean })?.needsEmailVerification) {
        setErrorMessage(err.message);
        setUnverifiedEmail(email.trim());
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
        setUnverifiedEmail(null);
      } else {
        setErrorMessage('Failed to sign in. Please check your credentials.');
        setUnverifiedEmail(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const prefetchDestinations = () => {
    import('@/pages/DashboardPage');
    import('@/pages/auth/SelectAreaPage');
    import('@/pages/MemberPortalPage');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
          {/* Left Hero Overview */}
          <section className="lg:col-span-6 bg-navy-deep text-white p-6 sm:p-10 flex flex-col justify-between border-r border-navy-surface relative overflow-hidden" aria-label="System overview">
            {/* Atmospheric overlay for optimal text contrast */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-navy-deep/85" aria-hidden="true" />

            {/* Foreground Hero Content (Layered above video wallpaper) */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <img
                    src="/img/logo.png"
                    alt="MFC Youth"
                    width={180}
                    height={84}
                    className="object-contain drop-shadow-sm"
                  />
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-navy-surface text-slate-200 border border-navy-light/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Cloud Connected
                  </span>
                </div>

                <div className="space-y-2 mb-8">
                  <p className="text-xs font-semibold text-amber-300 font-heading">
                    Area Management System
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight font-heading">
                    Lead your Area with one clear, secure workspace.
                  </h1>
                  <p className="text-sm text-slate-300">
                    Centralized operational portal for youth members, chapters, gatherings, and reports.
                  </p>
                </div>

                {/* Liturgical Daily Reading Card */}
                <div className="bg-navy-surface/90 border border-navy-light/40 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-300" />
                      <span className="text-xs font-bold text-white">Daily Scripture Readings</span>
                    </div>
                    {readingsData?.date && (
                      <span className="text-[11px] text-amber-200/90 font-medium">{readingsData.date}</span>
                    )}
                  </div>
                  {readingsLoading ? (
                    <p className="text-xs text-slate-300">Loading today's Catholic Mass readings...</p>
                  ) : readingsData?.celebration ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-white leading-snug">
                        {readingsData.celebration}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {readingsData.readings?.slice(0, 3).map((r, i) => (
                          <span key={i} className="text-[11px] bg-white/10 px-2 py-0.5 rounded text-slate-200 border border-white/10">
                            {r.type}: {r.reference}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">Daily liturgical feed available online.</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span>Missionary Families for Christ Youth</span>
                <Link to="/member-login" className="text-amber-300 hover:text-white font-semibold flex items-center gap-1 transition-colors">
                  Member Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* Right Login Card */}
          <section className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center" aria-labelledby="signin-title">
            <div className="max-w-md w-full mx-auto space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200/80 text-xs font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-navy" />
                  <span>Secure Leader Access</span>
                </div>
                <h2 id="signin-title" className="text-2xl font-bold text-text-main font-heading tracking-tight">
                  Sign in to your Area
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Enter your servant credentials to access area records.
                </p>
              </div>

              {registrationNotice && (
                <div className="p-3 text-sm text-mfc-green bg-emerald-50 border border-emerald-200 rounded-md font-medium" role="status">
                  {registrationNotice}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 text-sm text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium" role="alert">
                  <div>{errorMessage}</div>
                  {unverifiedEmail && (
                    <Link
                      to="/register"
                      state={{ email: unverifiedEmail, verifyOnly: true }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:underline mt-2"
                    >
                      <span>Enter your 6-digit email verification code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
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
                  label="Email Address"
                  type="email"
                  name="mfc_leader_email"
                  id="login-email"
                  required
                  autoComplete="off"
                  preventAutofill
                  disableCopyPaste
                  onBlockedClipboard={(action) => {
                    toast.error('Action blocked', `${action === 'paste' ? 'Pasting into' : 'Copying from'} email is disabled for credential security.`);
                  }}
                  placeholder="servant@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                />

                <Input
                  label="Password"
                  type="password"
                  name="mfc_leader_password"
                  id="login-password"
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
                  <label htmlFor="login-remember-me" className="flex items-center gap-2 cursor-pointer select-none min-h-[44px] py-1">
                    <input
                      id="login-remember-me"
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

                <div className="space-y-3 pt-2">
                  <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                    Sign In as Leader
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={() => navigate('/register')}
                  >
                    Leader Registration
                  </Button>
                </div>
              </form>

              <div className="pt-4 border-t border-border-subtle text-center text-xs text-text-muted">
                <span>Are you an MFC Youth Member? </span>
                <Link to="/member-login" className="font-bold text-navy hover:underline">
                  Sign in to Member Portal &rarr;
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-text-muted border-t border-border-subtle bg-white">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/member-login" className="font-semibold text-navy hover:underline">
            Member Portal
          </Link>
          <span>&middot;</span>
          <a href="https://mfcyouth.org" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
            Official MFC Youth <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
};
