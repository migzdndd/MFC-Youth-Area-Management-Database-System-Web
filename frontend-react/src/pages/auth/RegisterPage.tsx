import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { EmailVerificationField } from '@/components/auth/EmailVerificationField';
import { AreaDatabaseSelector, type AreaMode } from '@/components/auth/AreaDatabaseSelector';
import type { Area, UserProfile } from '@/types/auth';

type RegistrationStage = 'idle' | 'registering' | 'completed';

interface RegisterResponse {
  ok: boolean;
  message?: string;
  requiresEmailVerification?: boolean;
  requiresAreaSelection?: boolean;
  session?: {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    expiresAt?: number;
  };
  user?: UserProfile;
  area?: Area | null;
  error?: string;
}

interface RegistrationDraft {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  areaMode?: AreaMode;
  selectedAreaId?: string;
  newAreaName?: string;
  isEmailVerified?: boolean;
}

const REGISTRATION_DRAFT_KEY = 'mfc_registration_form_draft';

function getInitialDraft(): RegistrationDraft {
  if (typeof window === 'undefined') return {};
  try {
    const saved = sessionStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!saved) return {};
    const rawDraft = JSON.parse(saved);
    if (rawDraft.password || rawDraft.areaPasscode) {
      delete rawDraft.password;
      delete rawDraft.areaPasscode;
      sessionStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(rawDraft));
    }
    return rawDraft as RegistrationDraft;
  } catch {
    return {};
  }
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { setSession, setAssignedArea } = useAuthStore();

  const stateData = location.state as { email?: string } | null;
  const [initialDraft] = useState(getInitialDraft);

  // Form state
  const [firstName, setFirstName] = useState(initialDraft.firstName || '');
  const [middleName, setMiddleName] = useState(initialDraft.middleName || '');
  const [lastName, setLastName] = useState(initialDraft.lastName || '');
  const [email, setEmail] = useState(stateData?.email || initialDraft.email || '');
  const [password, setPassword] = useState('');
  const [areaPasscode, setAreaPasscode] = useState('');
  const [role, setRole] = useState(initialDraft.role || 'chapter_servant');

  // Area Database selection & creation state
  const [areaMode, setAreaMode] = useState<AreaMode>(initialDraft.areaMode || 'select');
  const [selectedAreaId, setSelectedAreaId] = useState(initialDraft.selectedAreaId || '');
  const [newAreaName, setNewAreaName] = useState(initialDraft.newAreaName || '');

  // Email verification state
  const [isEmailVerified, setIsEmailVerified] = useState(Boolean(initialDraft.isEmailVerified));
  const [emailNotification, setEmailNotification] = useState<string | null>(
    initialDraft.isEmailVerified ? 'Email is verified. You can now complete your registration.' : null
  );
  const [emailNotificationType, setEmailNotificationType] = useState<'info' | 'success' | 'error'>(
    initialDraft.isEmailVerified ? 'success' : 'info'
  );

  // Submission stage & callouts
  const [registrationStage, setRegistrationStage] = useState<RegistrationStage>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Save current non-credential form inputs to sessionStorage
  const saveDraft = useCallback((overrides?: Partial<RegistrationDraft>) => {
    try {
      const draft: RegistrationDraft = {
        firstName,
        middleName,
        lastName,
        email,
        role,
        areaMode,
        selectedAreaId,
        newAreaName,
        isEmailVerified,
        ...overrides,
      };
      sessionStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, [firstName, middleName, lastName, email, role, areaMode, selectedAreaId, newAreaName, isEmailVerified]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(REGISTRATION_DRAFT_KEY);
    } catch {
      // Ignore
    }
  };

  // Intercept redirect from Supabase email verification link (#access_token=... or ?type=signup)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const params = new URLSearchParams(cleanHash);
    const hasAuthToken = Boolean(params.get('access_token'));
    const isSignupType = params.get('type') === 'signup';

    if (hasAuthToken || isSignupType) {
      window.history.replaceState(null, '', window.location.pathname);

      const targetEmail = initialDraft.email || email;
      if (targetEmail) {
        apiClient<{ ok: boolean; verified: boolean; message?: string }>('/auth/check-email-verification', {
          method: 'POST',
          body: JSON.stringify({ email: targetEmail }),
        })
          .then((res) => {
            if (res.ok && res.verified) {
              setIsEmailVerified(true);
              setEmailNotification('Email is verified. You can now continue your registration.');
              setEmailNotificationType('success');
              toast.success('Email confirmed successfully!', 'Verified');
              saveDraft({ isEmailVerified: true, email: targetEmail });
            } else {
              setEmailNotificationType('error');
              setEmailNotification('Verification could not be confirmed. Click Verify to try again.');
            }
          })
          .catch(() => {
            setEmailNotificationType('error');
            setEmailNotification('Unable to verify email status. Please check your connection.');
          });
      }
    }
  }, [saveDraft, email, initialDraft.email, toast]);

  // Fetch available active area databases
  const {
    data: areas = [],
    isLoading: isLoadingAreas,
    error: areasError,
  } = useQuery<Area[]>({
    queryKey: ['public-registration-areas'],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; areas?: Area[]; data?: Area[] }>('/areas');
      return res.areas || res.data || [];
    },
    staleTime: 1000 * 60,
  });

  const effectiveAreaMode: AreaMode = !isLoadingAreas && areas.length === 0 ? 'create' : areaMode;

  // Submit Completed Registration Details
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isEmailVerified) {
      setErrorMessage('Please verify your email address before creating your account.');
      setEmailNotificationType('error');
      setEmailNotification('Click "Verify" beside your email to confirm your address before continuing.');
      return;
    }

    if (effectiveAreaMode === 'select' && !selectedAreaId) {
      setErrorMessage('Please select the Area Database you are assigned in, or create a new one.');
      return;
    }

    if (effectiveAreaMode === 'create' && newAreaName.trim().length < 3) {
      setErrorMessage('Please enter an Area Database name (at least 3 characters).');
      return;
    }

    setRegistrationStage('registering');

    try {
      const cleanFirst = firstName.trim();
      const cleanMiddle = middleName.trim();
      const cleanLast = lastName.trim();
      const payload: Record<string, unknown> = {
        first_name: cleanFirst,
        middle_name: cleanMiddle || null,
        last_name: cleanLast,
        displayName: [cleanFirst, cleanMiddle, cleanLast].filter(Boolean).join(' '),
        email: email.trim(),
        password,
        confirmPassword: password,
        area_passcode: areaPasscode.trim(),
        verificationCode: areaPasscode.trim(),
        role,
      };

      if (effectiveAreaMode === 'select') {
        payload.area_id = selectedAreaId;
      } else {
        payload.new_area_name = newAreaName.trim();
      }

      const res = await apiClient<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(res.message || res.error || 'Registration failed. Please check your passcode.');
      }

      clearDraft();

      if (res.session && res.user) {
        const accessToken = res.session.accessToken || res.session.access_token;
        const refreshToken = res.session.refreshToken || res.session.refresh_token;

        if (accessToken && refreshToken) {
          setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
            user: res.user,
          });

          if (res.area) {
            setAssignedArea(res.area, res.user.member_id);
          }

          queryClient.clear();
          setRegistrationStage('completed');
          toast.success('Account created successfully!', 'Welcome');

          setTimeout(() => {
            if (res.requiresAreaSelection) {
              navigate('/select-area', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }, 600);
        }
      } else {
        setSuccessMessage('Registration completed! Please sign in with your credentials.');
        navigate('/login', { replace: true });
      }
    } catch (err: unknown) {
      setRegistrationStage('idle');
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to register. Please check your information and passcode.');
      }
    }
  };

  const isProcessing = registrationStage === 'registering';

  return (
    <div className="min-h-screen bg-bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border-subtle p-6 sm:p-8 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-navy transition-colors py-1 px-2 rounded-lg hover:bg-slate-50 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
          <img src="/img/logo-2.png" alt="MFC Youth" width={32} height={32} />
        </div>

        {/* Title Section */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy/10 text-navy text-xs font-semibold mb-2">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Leader Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Register as Servant Leader
          </h1>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            Verify your email address and enter your details to set up your Area Database account.
          </p>
        </div>

        {/* Loading Indicator during submission */}
        {isProcessing && (
          <div
            className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-2 transition-all"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-navy animate-spin shrink-0" aria-hidden="true" />
              <span className="text-xs sm:text-sm text-slate-800 font-medium">
                Creating leader account and activating your Area Database...
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-navy animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* Error Callout */}
        {errorMessage && (
          <div
            className="p-3.5 text-sm text-mfc-red bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 font-medium"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-mfc-red shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Callout */}
        {successMessage && (
          <div
            className="p-3.5 text-sm text-mfc-green bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 font-medium"
            role="alert"
          >
            <CheckCircle2 className="w-4 h-4 text-mfc-green shrink-0 mt-0.5" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmitRegistration} autoComplete="off" className="space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="First Name"
              required
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isProcessing}
            />
            <Input
              label="Middle Name"
              placeholder="Optional"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              disabled={isProcessing}
            />
            <Input
              label="Last Name"
              required
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* Modular Email Verification Field */}
          <EmailVerificationField
            email={email}
            onChangeEmail={setEmail}
            isVerified={isEmailVerified}
            onVerifiedChange={setIsEmailVerified}
            disabled={isProcessing}
            onBeforeSend={() => saveDraft({ email })}
            notification={emailNotification}
            notificationType={emailNotificationType}
            onNotificationChange={(msg, type) => {
              setEmailNotification(msg);
              setEmailNotificationType(type);
            }}
          />

          {/* Password */}
          <Input
            label="Password"
            type="password"
            name="register_password"
            id="register-password"
            required
            autoComplete="new-password"
            preventAutofill
            disableCopyPaste
            onBlockedClipboard={(action) => {
              toast.error('Action blocked', `${action === 'paste' ? 'Pasting into' : 'Copying from'} password is disabled for credential security.`);
            }}
            placeholder="Create password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isProcessing}
          />

          {/* Area Passcode */}
          <Input
            label="Area Passcode"
            name="register_area_passcode"
            id="register-area-passcode"
            required
            autoComplete="off"
            preventAutofill
            disableCopyPaste
            onBlockedClipboard={(action) => {
              toast.error('Action blocked', `${action === 'paste' ? 'Pasting into' : 'Copying from'} Area Passcode is disabled for credential security.`);
            }}
            placeholder="Enter Area Passcode provided by your Area Servant"
            value={areaPasscode}
            onChange={(e) => setAreaPasscode(e.target.value)}
            disabled={isProcessing}
            helperText="Area Passcode protects authorized community registration."
          />

          {/* Leadership Role */}
          <Select
            label="Leadership Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isProcessing}
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

          {/* Modular Area Database Assignment & Creation */}
          <AreaDatabaseSelector
            mode={effectiveAreaMode}
            onModeChange={(newMode) => {
              setAreaMode(newMode);
              setErrorMessage('');
            }}
            selectedAreaId={selectedAreaId}
            onSelectAreaId={setSelectedAreaId}
            newAreaName={newAreaName}
            onChangeNewAreaName={setNewAreaName}
            areas={areas}
            isLoadingAreas={isLoadingAreas}
            areasError={areasError}
            disabled={isProcessing}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4 min-h-[44px]"
            isLoading={isProcessing}
            disabled={isProcessing}
          >
            Create Servant Leader Account &rarr;
          </Button>
        </form>

        {/* Existing account link */}
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
