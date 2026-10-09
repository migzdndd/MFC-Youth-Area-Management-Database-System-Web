import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserCheck, ArrowLeft } from 'lucide-react';
import type { UserProfile } from '@/types/auth';

export const MemberLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
        body: JSON.stringify({ email, password, portal: 'member' }),
      });

      if (res.access_token && res.user) {
        setSession({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          user: res.user,
        });
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

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-navy">
            <ArrowLeft className="w-4 h-4" />
            <span>Leader Portal</span>
          </Link>
          <img src="/img/logo-2.png" alt="MFC Youth" width={32} height={32} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 text-sky-800 text-xs font-semibold mb-2 border border-sky-100">
            <UserCheck className="w-3.5 h-3.5" />
            <span>MFC Youth Member Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Member Email"
            type="email"
            required
            autoComplete="email"
            placeholder="member@example.com"
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

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Sign In to Member Portal
          </Button>
        </form>

        <div className="pt-4 border-t border-border-subtle text-center text-xs text-text-muted">
          <span>Are you a Servant Leader? </span>
          <Link to="/login" className="font-bold text-navy hover:underline">
            Leader Portal Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
