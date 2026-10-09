import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage('Password reset instructions have been dispatched to your email.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to initiate password recovery.');
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
            <span>Back to Sign In</span>
          </Link>
          <img src="/img/logo-2.png" alt="MFC Youth" width={32} height={32} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <KeyRound className="w-3.5 h-3.5 text-navy" />
            <span>Account Recovery</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Reset Your Password
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Enter your email address and we will send you a secure recovery link.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 text-sm text-mfc-green bg-emerald-50 border border-emerald-200 rounded-md font-medium" role="alert">
            {message}
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

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Send Recovery Link
          </Button>
        </form>
      </div>
    </div>
  );
};
