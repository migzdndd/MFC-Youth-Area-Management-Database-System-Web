import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDailyReadings } from '@/hooks/useReadings';
import { ShieldCheck, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import type { UserProfile } from '@/types/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: readingsData, isLoading: readingsLoading } = useDailyReadings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await apiClient<{
        ok: boolean;
        access_token: string;
        refresh_token: string;
        user: UserProfile;
        error?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });

      if (res.access_token && res.user) {
        setSession({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          user: res.user,
        });

        if (res.user.role === 'member') {
          navigate('/member');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
          {/* Left Hero Overview */}
          <section className="lg:col-span-6 bg-navy text-white p-6 sm:p-10 flex flex-col justify-between" aria-label="System overview">
            <div>
              <div className="flex items-center justify-between mb-8">
                <img
                  src="/img/logo.png"
                  alt="MFC Youth"
                  width={180}
                  height={84}
                  className="object-contain"
                />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-sky-200 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Cloud Connected
                </span>
              </div>

              <div className="space-y-2 mb-8">
                <span className="text-xs font-bold tracking-widest text-sky-300 font-heading">
                  AREA MANAGEMENT SYSTEM
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight font-heading">
                  Lead your Area with one clear, secure workspace.
                </h1>
                <p className="text-sm text-slate-300">
                  Centralized operational portal for youth members, chapters, gatherings, and reports.
                </p>
              </div>

              {/* Liturgical Daily Reading Card */}
              <div className="bg-white/10 border border-white/15 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-300" />
                    <span className="text-xs font-bold text-white">Daily Scripture Readings</span>
                  </div>
                  {readingsData?.date && (
                    <span className="text-[11px] text-sky-200">{readingsData.date}</span>
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
                        <span key={i} className="text-[11px] bg-white/10 px-2 py-0.5 rounded text-sky-100">
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
              <Link to="/member-login" className="text-sky-300 hover:text-white font-semibold flex items-center gap-1">
                Member Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* Right Login Card */}
          <section className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center" aria-labelledby="signin-title">
            <div className="max-w-md w-full mx-auto space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
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

              {errorMessage && (
                <div className="p-3 text-sm text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="servant@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center justify-between text-sm pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-navy focus:ring-navy w-4 h-4"
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
          <span>&middot;</span>
          <Link to="/changelogs" className="hover:underline">
            System Changelogs
          </Link>
        </div>
      </footer>
    </div>
  );
};
