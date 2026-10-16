import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { UserCheck, KeyRound, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import type { UserProfile } from '@/types/auth';

interface MemberClaimWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemberClaimWizardModal: React.FC<MemberClaimWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setBirthdate('');
    setPin('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessNotice(null);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid member email address.');
      return;
    }
    if (!birthdate) {
      setErrorMessage('Please select your birthdate.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!pin.trim() || !/^\d{4,6}$/.test(pin.trim())) {
      setErrorMessage('Please enter a 4 to 6 digit numeric security PIN.');
      return;
    }
    setStep(3);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password entry.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient<{
        ok?: boolean;
        error?: string;
        message?: string;
        verificationRequired?: boolean;
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
          areaId?: string;
          area_id?: string;
          chapterId?: string | null;
          chapter_id?: string | null;
          memberId?: string | null;
          member_id?: string | null;
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          name?: string;
        };
      }>('/auth/member-claim', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          birthdate,
          pin: pin.trim(),
          password,
        }),
      });

      if (!res.ok && res.error) {
        setErrorMessage(res.error);
        return;
      }

      const accessToken = res.session?.accessToken || res.session?.access_token;
      const refreshToken = res.session?.refreshToken || res.session?.refresh_token || '';

      if (accessToken && res.user) {
        const rawUser = res.user;
        const normalizedUser: UserProfile = {
          id: rawUser.id,
          email: rawUser.email,
          role: 'member',
          area_id: rawUser.areaId || rawUser.area_id || '',
          chapter_id: rawUser.chapterId || rawUser.chapter_id || null,
          member_id: rawUser.memberId || rawUser.member_id || null,
          first_name: rawUser.first_name || (rawUser.name ? rawUser.name.split(' ')[0] : ''),
          middle_name: rawUser.middle_name || null,
          last_name: rawUser.last_name || (rawUser.name ? rawUser.name.split(' ').slice(1).join(' ') : ''),
        };

        setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
          user: normalizedUser,
        });

        handleModalClose();
        navigate('/member');
      } else {
        setSuccessNotice(
          res.message ||
            'Profile verification initiated. Please check your email inbox to complete registration before logging in.'
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to claim member record. Please confirm your details with your Chapter Head.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Claim Your Youth Profile"
      description="Connect your church roster record to activate your Member Portal access"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1 ? 'bg-navy text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-slate-700">Roster Info</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2 ? 'bg-navy text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-slate-700">Security PIN</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3 ? 'bg-navy text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-slate-700">Password</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs text-mfc-red bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 font-heading">
              Verification Notice Sent
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {successNotice}
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleModalClose}
              className="min-h-[44px] px-6"
            >
              Return to Member Sign In
            </Button>
          </div>
        ) : (
          <>
            {/* Step 1: Member Email & Birthdate */}
            {step === 1 && (
              <form onSubmit={handleNextStep1} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter the email and birthdate recorded on your MFC Youth membership form.
                </p>

                <Input
                  label="Registered Email Address"
                  type="email"
                  id="claim-email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  id="claim-birthdate"
                  required
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="secondary" onClick={handleModalClose} className="min-h-[44px]">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="min-h-[44px] flex items-center gap-1.5">
                    <span>Continue to PIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Security PIN */}
            {step === 2 && (
              <form onSubmit={handleNextStep2} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Enter the 4 to 6 digit verification PIN issued by your Chapter Head or Servant Leader.
                  </span>
                </div>

                <Input
                  label="Security PIN (4-6 digits)"
                  type="password"
                  id="claim-pin"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                />

                <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="min-h-[44px] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button type="submit" variant="primary" className="min-h-[44px] flex items-center gap-1.5">
                    <span>Set Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Password & Confirmation */}
            {step === 3 && (
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Create a secure password to access your Member Portal in the future.
                </p>

                <Input
                  label="New Password"
                  type="password"
                  id="claim-password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  id="claim-confirm-password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(2)}
                    className="min-h-[44px] flex items-center gap-1.5"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="min-h-[44px] flex items-center gap-1.5"
                    isLoading={isLoading}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Activate Profile</span>
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
