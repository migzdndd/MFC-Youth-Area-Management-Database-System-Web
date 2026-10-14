import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  ArrowLeft,
  UserPlus,
  Database,
  PlusCircle,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import type { Area, UserProfile } from '@/types/auth';

type AreaMode = 'select' | 'create';
type RegistrationStage = 'idle' | 'registering' | 'validating' | 'completed';

interface RegisterResponse {
  ok: boolean;
  message?: string;
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

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { setSession, setAssignedArea } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [areaPasscode, setAreaPasscode] = useState('');
  const [role, setRole] = useState('chapter_servant');

  // Area Database selection & creation state
  const [areaMode, setAreaMode] = useState<AreaMode>('select');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [newAreaName, setNewAreaName] = useState('');

  const [registrationStage, setRegistrationStage] = useState<RegistrationStage>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  // If no areas exist yet in the database, automatically default to create mode
  useEffect(() => {
    if (!isLoadingAreas && areas.length === 0) {
      setAreaMode('create');
    }
  }, [isLoadingAreas, areas.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Pre-flight validation
    if (areaMode === 'select' && !selectedAreaId) {
      setErrorMessage('Please select the Area Database you are assigned in, or create a new one.');
      return;
    }

    if (areaMode === 'create' && newAreaName.trim().length < 3) {
      setErrorMessage('Please enter an Area Database name (at least 3 characters).');
      return;
    }

    setRegistrationStage('registering');

    try {
      const payload: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        password,
        confirmPassword: password,
        area_passcode: areaPasscode.trim(),
        verificationCode: areaPasscode.trim(),
        role,
      };

      if (areaMode === 'select') {
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

      // Phase 2: System Validation
      setRegistrationStage('validating');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const accessToken = res.session?.accessToken || res.session?.access_token;
      const refreshToken = res.session?.refreshToken || res.session?.refresh_token;

      if (accessToken && refreshToken && res.user) {
        setRegistrationStage('completed');

        // Store authoritative session
        setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
          user: res.user,
        });

        // Set assigned area if created or selected
        if (res.area) {
          setAssignedArea(res.area, res.user.member_id);
        }

        queryClient.clear();

        const validatedName = res.area?.name || 'Area';
        setSuccessMessage(`Validated: Successfully assigned to ${validatedName} Area Database. Welcome!`);
        toast.success(`Assigned to ${validatedName} Area Database.`, 'System Validated');

        // Direct navigation to dashboard as usual
        setTimeout(() => {
          if (res.requiresAreaSelection) {
            navigate('/select-area', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 800);
      } else {
        // Fallback: If no auto-session returned, prompt sign-in
        setSuccessMessage('Registration successful! Redirecting to sign in...');
        setTimeout(() => navigate('/login', { state: { registered: true, email: email.trim() } }), 1200);
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

  const isProcessing = registrationStage !== 'idle';

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 py-8">
      <div className="max-w-xl w-full bg-white border border-border-subtle rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Navigation & Logo Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
          <img src="/img/logo-2.png" alt="MFC Youth" width={32} height={32} />
        </div>

        {/* Title */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy/10 text-navy text-xs font-semibold mb-2">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Leader Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Register as Servant Leader
          </h1>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            Authorized servant registration with live Area Database assignment and verification.
          </p>
        </div>

        {/* Validation Progress Indicator */}
        {isProcessing && (
          <div
            className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-2 transition-all"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              {registrationStage === 'registering' && (
                <>
                  <Loader2 className="w-5 h-5 text-navy animate-spin shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm text-slate-800 font-medium">
                    Creating leader account and configuring database records...
                  </span>
                </>
              )}
              {registrationStage === 'validating' && (
                <>
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm text-slate-800 font-medium">
                    Validating area database assignment and permissions...
                  </span>
                </>
              )}
              {registrationStage === 'completed' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-mfc-green shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm text-emerald-900 font-bold">
                    System validated! Entering the system...
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  registrationStage === 'registering' ? 'bg-navy animate-pulse' : 'bg-emerald-600'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  registrationStage === 'registering'
                    ? 'bg-slate-200'
                    : registrationStage === 'validating'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-600'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  registrationStage === 'completed' ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
              />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Servant Leader Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
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

          <Input
            label="Email Address"
            type="email"
            required
            autoComplete="email"
            placeholder="servant@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isProcessing}
          />

          <Input
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isProcessing}
          />

          <Input
            label="Area Passcode"
            required
            placeholder="Enter Area Passcode provided by your Area Servant"
            value={areaPasscode}
            onChange={(e) => setAreaPasscode(e.target.value)}
            disabled={isProcessing}
            helperText="Area Passcode protects authorized community registration."
          />

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

          {/* Area Database Selection & Creation Section */}
          <div className="pt-3 border-t border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-navy" aria-hidden="true" />
                <span>Area Database Assignment</span>
                <span className="text-mfc-red">*</span>
              </label>
              <span className="text-xs text-text-muted">
                {areas.length} available {areas.length === 1 ? 'database' : 'databases'}
              </span>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={areaMode === 'select'}
                disabled={isProcessing}
                onClick={() => {
                  setAreaMode('select');
                  setErrorMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                  areaMode === 'select'
                    ? 'bg-white text-navy shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Select Existing Area</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={areaMode === 'create'}
                disabled={isProcessing}
                onClick={() => {
                  setAreaMode('create');
                  setErrorMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                  areaMode === 'create'
                    ? 'bg-white text-navy shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Create New Area</span>
              </button>
            </div>

            {/* Mode 1: Select Existing Area Database */}
            {areaMode === 'select' && (
              <div className="space-y-2">
                {isLoadingAreas ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-navy" />
                    <span>Loading available Area Databases...</span>
                  </div>
                ) : areas.length > 0 ? (
                  <Select
                    label="Assigned Area Database"
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    disabled={isProcessing}
                    options={[
                      { value: '', label: '-- Choose your assigned Area Database --' },
                      ...areas.map((a) => ({ value: a.id, label: a.name })),
                    ]}
                  />
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-2">
                    <p className="text-xs text-slate-600">
                      No active Area Databases exist in the system yet.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setAreaMode('create')}
                      className="text-xs"
                    >
                      Create First Area Database
                    </Button>
                  </div>
                )}
                {areasError && (
                  <p className="text-xs text-amber-700">
                    Notice: Could not load the area list. You can create a new area below.
                  </p>
                )}
              </div>
            )}

            {/* Mode 2: Create New Area Database */}
            {areaMode === 'create' && (
              <div className="space-y-2">
                <Input
                  label="New Area Database Name"
                  required
                  placeholder="e.g. Metro Manila South, Cebu Central, Laguna"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  disabled={isProcessing}
                  helperText="Enter the official regional territory name for this new database."
                />
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    The system will automatically initialize standard youth ministry services and validate your leadership assignment upon registration.
                  </span>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4 min-h-[44px]"
            isLoading={isProcessing}
          >
            Complete Registration &amp; Validate Access
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

