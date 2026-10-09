import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, UserPlus } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [areaPasscode, setAreaPasscode] = useState('');
  const [role, setRole] = useState('chapter_servant');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await apiClient<{ ok: boolean; message?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          area_passcode: areaPasscode,
          role,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Registration successful! You can now sign in with your credentials.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setErrorMessage(res.message || 'Registration failed. Please check your passcode.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to register. Please check your information and passcode.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="max-w-lg w-full bg-white border border-border-subtle rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-navy">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
          <img src="/img/logo-2.png" alt="MFC Youth" width={32} height={32} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy/10 text-navy text-xs font-semibold mb-2">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Leader Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Register as Servant Leader
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Authorized servant registration secured by your official Area Passcode.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 text-sm text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 text-sm text-mfc-green bg-emerald-50 border border-emerald-200 rounded-md font-medium" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              required
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

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
            autoComplete="new-password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Area Passcode"
            required
            placeholder="Enter Area Passcode provided by your Area Servant"
            value={areaPasscode}
            onChange={(e) => setAreaPasscode(e.target.value)}
            helperText="Area Passcode prevents unauthorized community registration."
          />

          <Select
            label="Leadership Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'chapter_servant', label: 'Chapter Servant' },
              { value: 'campus_servant', label: 'Campus Servant' },
              { value: 'mfc_high_servant', label: 'MFC High Servant' },
              { value: 'area_kids_servant', label: 'Area Kids Servant' },
              { value: 'lit_servant', label: 'LIT Servant' },
              { value: 'couple_coordinator', label: 'Couple Coordinator' },
              { value: 'area_servant', label: 'Area Servant' },
            ]}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Complete Leader Registration
          </Button>
        </form>

        <div className="pt-4 border-t border-border-subtle text-center text-xs text-text-muted">
          <span>Already registered? </span>
          <Link to="/login" className="font-bold text-navy hover:underline">
            Sign In here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
