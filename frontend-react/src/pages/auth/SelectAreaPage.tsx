import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Database,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { Area, UserProfile } from '@/types/auth';

type SetupMode = 'select' | 'create';
type ValidationStage = 'idle' | 'assigning' | 'validating' | 'verified' | 'initializing';

export const SelectAreaPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, token, setAssignedArea, logout } = useAuthStore();

  const [mode, setMode] = useState<SetupMode>('select');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [newAreaName, setNewAreaName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [validationStage, setValidationStage] = useState<ValidationStage>('idle');
  const [verifiedAreaName, setVerifiedAreaName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const searchInputId = useId();

  // Fetch available active area databases
  const {
    data: areas = [],
    isLoading: isLoadingAreas,
    error: areasFetchError,
    refetch: refetchAreas,
  } = useQuery({
    queryKey: ['available-areas-setup'],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; areas?: Area[]; data?: Area[] }>('/areas');
      return res.areas || res.data || [];
    },
    enabled: Boolean(token && user),
    staleTime: 1000 * 30,
  });

  const leaderName = user?.first_name
    ? [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')
    : (user?.email ? user.email.split('@')[0] : 'Servant Leader');

  // Filter areas based on search input
  const filteredAreas = areas.filter((area) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return area.name.toLowerCase().includes(q) || (area.passcode && area.passcode.toLowerCase().includes(q));
  });

  // Handle Leader Sign Out if they wish to use a different account
  const handleSignOut = () => {
    logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  // Submission & Multi-phase Validation handler
  const handleAssignArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'select' && !selectedAreaId) {
      setErrorMessage('Please select your Area Database to continue.');
      return;
    }

    if (mode === 'create' && newAreaName.trim().length < 3) {
      setErrorMessage('Please enter an Area Database name (at least 3 characters).');
      return;
    }

    try {
      // -----------------------------------------------------------------
      // PHASE 1: SUBMIT ASSIGNMENT OR CREATION TO BACKEND
      // -----------------------------------------------------------------
      setValidationStage('assigning');

      let targetArea: Area | null = null;
      let returnedMemberId: string | null = null;

      if (mode === 'select') {
        const res = await apiClient<{
          ok: boolean;
          area: Area;
          profile?: { area_id?: string; member_id?: string };
          member?: { id?: string };
        }>('/areas/select', {
          method: 'POST',
          body: JSON.stringify({ areaId: selectedAreaId }),
        });

        if (!res.ok || !res.area?.id) {
          throw new Error('Failed to join the selected Area Database. Please try again.');
        }

        targetArea = res.area;
        returnedMemberId = res.member?.id || res.profile?.member_id || null;
      } else {
        const res = await apiClient<{
          ok: boolean;
          area: Area;
          profile?: { area_id?: string; member_id?: string };
          member?: { id?: string };
        }>('/areas', {
          method: 'POST',
          body: JSON.stringify({ name: newAreaName.trim() }),
        });

        if (!res.ok || !res.area?.id) {
          throw new Error('Failed to create the Area Database. Please try again.');
        }

        targetArea = res.area;
        returnedMemberId = res.member?.id || res.profile?.member_id || null;
      }

      setVerifiedAreaName(targetArea.name);

      // -----------------------------------------------------------------
      // PHASE 2: VALIDATE LEADER ASSIGNMENT IN THE AREA DATABASE
      // -----------------------------------------------------------------
      setValidationStage('validating');

      // Query authoritative current account profile from /auth/me to verify database persistence
      const meRes = await apiClient<{
        ok: boolean;
        user: UserProfile & { areaId?: string; area_id?: string };
      }>('/auth/me');

      const verifiedAreaId = meRes.user?.area_id || meRes.user?.areaId;
      const isGlobalAdmin = Boolean(meRes.user?.is_developer || meRes.user?.role === 'national_coordinator');
      if (!isGlobalAdmin && (!verifiedAreaId || verifiedAreaId !== targetArea.id)) {
        throw new Error(
          'Assignment validation check failed: The database has not registered your area assignment. Please retry.'
        );
      }

      // -----------------------------------------------------------------
      // PHASE 3: CONFIRM VERIFIED STATUS
      // -----------------------------------------------------------------
      setValidationStage('verified');
      await new Promise((resolve) => setTimeout(resolve, 600));

      // -----------------------------------------------------------------
      // PHASE 4: INITIALIZE DASHBOARD & CACHES
      // -----------------------------------------------------------------
      setValidationStage('initializing');

      // Commit assignment to client state and localStorage
      setAssignedArea(targetArea, returnedMemberId || meRes.user?.member_id);

      // Invalidate query caches so that fresh area-scoped datasets load for this database
      queryClient.clear();

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success(
        `Validated: Assigned to ${targetArea.name} Area Database.`,
        'Area Database Initialized'
      );

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setValidationStage('idle');
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred while setting up your Area Database.');
      }
    }
  };

  const isProcessing = validationStage !== 'idle';

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <img src="/img/logo-2.png" alt="MFC Youth Logo" width={36} height={36} className="object-contain" />
          <span className="font-heading font-bold text-navy text-sm sm:text-base tracking-tight">
            MFC Youth Management
          </span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors cursor-pointer py-1.5 px-2.5 rounded-md hover:bg-slate-100 min-h-[36px]"
          title="Sign out and return to login"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container Card */}
      <main className="max-w-2xl w-full mx-auto bg-white border border-border-subtle rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Title Section */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy/10 text-navy text-xs font-semibold">
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Leader Onboarding</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading tracking-tight">
            Which area database are you in?
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Welcome, <strong className="text-slate-900 font-semibold">{leaderName}</strong>! To begin serving, please select your assigned MFC Youth Area Database or create a new area community database.
          </p>
        </div>

        {/* Validation Progression Overlay / Banner */}
        {validationStage !== 'idle' && (
          <div
            className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-2.5 transition-all"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              {validationStage === 'assigning' && (
                <>
                  <Loader2 className="w-5 h-5 text-navy animate-spin shrink-0" aria-hidden="true" />
                  <div className="text-xs sm:text-sm text-slate-800 font-medium">
                    Assigning your leadership account to the Area Database...
                  </div>
                </>
              )}

              {validationStage === 'validating' && (
                <>
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" aria-hidden="true" />
                  <div className="text-xs sm:text-sm text-slate-800 font-medium">
                    Validating that you are officially assigned in the <strong className="font-semibold text-slate-900">{verifiedAreaName || 'Area'}</strong> database...
                  </div>
                </>
              )}

              {validationStage === 'verified' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-mfc-green shrink-0" aria-hidden="true" />
                  <div className="text-xs sm:text-sm text-emerald-900 font-bold">
                    Assignment validated! Assigned to {verifiedAreaName} Database.
                  </div>
                </>
              )}

              {validationStage === 'initializing' && (
                <>
                  <ShieldCheck className="w-5 h-5 text-navy shrink-0" aria-hidden="true" />
                  <div className="text-xs sm:text-sm text-navy font-bold">
                    Initializing your dashboard and caches...
                  </div>
                </>
              )}
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-2 pt-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  validationStage === 'assigning' ? 'bg-navy animate-pulse' : 'bg-emerald-600'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  validationStage === 'assigning'
                    ? 'bg-slate-200'
                    : validationStage === 'validating'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-600'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  ['assigning', 'validating'].includes(validationStage)
                    ? 'bg-slate-200'
                    : 'bg-emerald-600'
                }`}
              />
            </div>
          </div>
        )}

        {/* Error Callout */}
        {errorMessage && (
          <div className="p-3.5 text-sm text-mfc-red bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 font-medium" role="alert">
            <AlertCircle className="w-4 h-4 text-mfc-red shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode Segmented Controls */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'select'}
            disabled={isProcessing}
            onClick={() => {
              setMode('select');
              setErrorMessage('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[44px] cursor-pointer ${
              mode === 'select'
                ? 'bg-white text-navy shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" aria-hidden="true" />
            <span>Select Existing Area</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            disabled={isProcessing}
            onClick={() => {
              setMode('create');
              setErrorMessage('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[44px] cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-navy shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            <span>Create New Area</span>
          </button>
        </div>

        {/* Tab 1: Select Existing Area Database */}
        {mode === 'select' && (
          <form onSubmit={handleAssignArea} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="area-selection-input" className="text-xs sm:text-sm font-semibold text-slate-900">
                  Select your Area Database:
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {areas.length} available {areas.length === 1 ? 'database' : 'databases'}
                </span>
              </div>

              {/* Area search input if more than 3 areas */}
              {areas.length > 3 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id={searchInputId}
                    type="search"
                    placeholder="Search area name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isProcessing}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 text-slate-900 border border-slate-200 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy"
                  />
                </div>
              )}

              {/* Loading State */}
              {isLoadingAreas && (
                <div className="p-8 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-navy" aria-hidden="true" />
                  <span className="text-xs font-medium">Loading area databases...</span>
                </div>
              )}

              {/* Fetch Error State */}
              {areasFetchError && !isLoadingAreas && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 flex items-center justify-between">
                  <span>Unable to load area list.</span>
                  <button
                    type="button"
                    onClick={() => refetchAreas()}
                    className="text-xs font-bold text-amber-950 underline hover:no-underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty Areas State */}
              {!isLoadingAreas && areas.length === 0 && !areasFetchError && (
                <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center space-y-3">
                  <Database className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">No active Area Databases found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      There are no registered Area Databases in the system yet. You can create the first Area Database.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setMode('create')}
                    className="text-xs"
                  >
                    Switch to Create Area
                  </Button>
                </div>
              )}

              {/* Area List Cards */}
              {!isLoadingAreas && areas.length > 0 && (
                <div
                  id="area-selection-input"
                  className="space-y-2 max-h-64 overflow-y-auto pr-1"
                  role="radiogroup"
                  aria-label="Available Area Databases"
                >
                  {filteredAreas.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      No Area Database matches "{searchQuery}".
                    </p>
                  ) : (
                    filteredAreas.map((area) => {
                      const isSelected = selectedAreaId === area.id;
                      return (
                        <div
                          key={area.id}
                          onClick={() => {
                            if (!isProcessing) {
                              setSelectedAreaId(area.id);
                              setErrorMessage('');
                            }
                          }}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if ((e.key === ' ' || e.key === 'Enter') && !isProcessing) {
                              e.preventDefault();
                              setSelectedAreaId(area.id);
                              setErrorMessage('');
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between min-h-[52px] select-none ${
                            isSelected
                              ? 'border-navy bg-navy/5 ring-1 ring-navy'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'border-navy bg-navy' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                                {area.name}
                              </span>
                              <span className="text-[10px] sm:text-xs text-slate-500 font-mono">
                                {area.passcode || 'MFC-YOUTH'}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy">
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="hidden sm:inline">Selected</span>
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isProcessing || !selectedAreaId || isLoadingAreas}
              isLoading={isProcessing}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              <span>Assign &amp; Validate Area Database</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </form>
        )}

        {/* Tab 2: Create New Area Database */}
        {mode === 'create' && (
          <form onSubmit={handleAssignArea} className="space-y-4">
            <div className="space-y-2">
              <Input
                label="New Area Database Name"
                required
                placeholder="e.g. Metro Manila South, Cebu Central, Laguna"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                disabled={isProcessing}
                helperText="Enter the official territory or geographic name of this MFC Youth area."
              />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Automatic Setup &amp; Service Catalog</span>
              </div>
              <p className="leading-relaxed">
                Creating an Area Database will establish its regional registry, initialize all standard youth ministry services, and link your account as the founding Servant Leader.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isProcessing || newAreaName.trim().length < 3}
              isLoading={isProcessing}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              <span>Create, Validate &amp; Initialize Area Database</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </form>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="max-w-2xl w-full mx-auto text-center pt-4 text-xs text-slate-400">
        MFC Youth Area Management System &bull; Secure Leader Onboarding
      </footer>
    </div>
  );
};
