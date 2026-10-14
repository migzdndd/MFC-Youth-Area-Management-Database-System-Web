import { create } from 'zustand';
import type { UserProfile, UserRole, Area } from '@/types/auth';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  activeArea: Area | null;
  simulatedRole: UserRole | null;
  pendingAreaSwitch: Area | null;
  roleRestorationValidated: boolean;
  isLoading: boolean;
  setSession: (session: { access_token: string; refresh_token: string; user: UserProfile } | null) => void;
  setActiveArea: (area: Area | null, role?: UserRole | null) => void;
  setAssignedArea: (area: Area, memberId?: string | null) => void;
  requestAreaSwitch: (targetArea: Area | null) => boolean;
  confirmPendingAreaSwitch: () => { success: boolean; restoredRole: UserRole; areaName: string } | null;
  cancelPendingAreaSwitch: () => void;
  clearRestorationValidation: () => void;
  setSimulatedRole: (role: UserRole | null) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  canAccessPage: (page: string) => boolean;
}

const SESSION_STORAGE_KEY = 'mfc_ams_session';
const ACTIVE_AREA_KEY = 'mfc_ams_active_area';

function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredArea() {
  try {
    const raw = localStorage.getItem(ACTIVE_AREA_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const initialSession = getStoredSession();
const initialArea = getStoredArea();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialSession?.user
    ? {
        ...initialSession.user,
        home_role: initialSession.user.home_role || initialSession.user.role,
      }
    : null,
  token: initialSession?.access_token || null,
  refreshToken: initialSession?.refresh_token || null,
  activeArea: initialArea || null,
  simulatedRole: null,
  pendingAreaSwitch: null,
  roleRestorationValidated: false,
  isLoading: false,

  setSession: (session) => {
    if (session) {
      const user = {
        ...session.user,
        home_role: session.user.home_role || session.user.role,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...session, user }));
      const userArea: Area | null = user.area_id
        ? { id: user.area_id, name: user.area_name || '' }
        : null;
      if (userArea) {
        localStorage.setItem(ACTIVE_AREA_KEY, JSON.stringify(userArea));
      } else {
        localStorage.removeItem(ACTIVE_AREA_KEY);
      }
      set({
        user,
        token: session.access_token,
        refreshToken: session.refresh_token,
        activeArea: userArea,
        simulatedRole: null,
        pendingAreaSwitch: null,
        roleRestorationValidated: false,
      });
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_AREA_KEY);
      set({
        user: null,
        token: null,
        refreshToken: null,
        activeArea: null,
        simulatedRole: null,
        pendingAreaSwitch: null,
        roleRestorationValidated: false,
      });
    }
  },

  setActiveArea: (area, roleOverride) => {
    const current = get().user;
    if (area) {
      localStorage.setItem(ACTIVE_AREA_KEY, JSON.stringify(area));
    } else {
      localStorage.removeItem(ACTIVE_AREA_KEY);
    }

    if (!current) {
      set({ activeArea: area });
      return;
    }

    const homeRole = current.home_role || current.role;
    const isHomeArea = !area || area.id === current.area_id;

    if (isHomeArea) {
      // Returned to home area: restore authentic role
      const updatedUser = { ...current, home_role: homeRole, role: homeRole };
      set({ activeArea: area, user: updatedUser, simulatedRole: null, roleRestorationValidated: true });
    } else {
      // Simulating or inspecting another area
      const isNational = homeRole === 'national_coordinator';
      const effectiveRole: UserRole = isNational
        ? 'national_coordinator'
        : (roleOverride !== undefined && roleOverride !== null ? roleOverride : (get().simulatedRole || 'member'));

      const updatedUser = { ...current, home_role: homeRole, role: effectiveRole };
      set({ activeArea: area, user: updatedUser, simulatedRole: effectiveRole });
    }
  },

  setAssignedArea: (area, memberId) => {
    const current = get().user;
    if (!current) return;
    const homeRole = current.home_role || current.role;
    const updatedUser: UserProfile = {
      ...current,
      home_role: homeRole,
      role: homeRole,
      area_id: area.id,
      area_name: area.name,
      ...(memberId ? { member_id: memberId } : {}),
      requiresAreaSelection: false,
      requires_area_selection: false,
    };

    localStorage.setItem(ACTIVE_AREA_KEY, JSON.stringify(area));

    const session = getStoredSession();
    if (session) {
      session.user = updatedUser;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    set({
      user: updatedUser,
      activeArea: area,
      simulatedRole: null,
      pendingAreaSwitch: null,
      roleRestorationValidated: true,
    });
  },

  requestAreaSwitch: (targetArea) => {
    const { simulatedRole, activeArea, user } = get();
    // Intercept switch if currently simulating a live role and switching to a DIFFERENT area
    const currentAreaId = activeArea?.id || user?.area_id || '';
    const targetAreaId = targetArea?.id || '';
    const isDifferentArea = targetAreaId !== currentAreaId;

    if (simulatedRole && isDifferentArea && targetArea) {
      set({ pendingAreaSwitch: targetArea, roleRestorationValidated: false });
      return false; // Intercepted: prompt user
    }

    get().setActiveArea(targetArea);
    return true; // Proceeded directly
  },

  confirmPendingAreaSwitch: () => {
    const { pendingAreaSwitch, user } = get();
    if (!pendingAreaSwitch || !user) return null;

    const originalRole = user.home_role || user.role;
    const targetArea = pendingAreaSwitch;

    localStorage.setItem(ACTIVE_AREA_KEY, JSON.stringify(targetArea));

    const updatedUser = {
      ...user,
      home_role: originalRole,
      role: originalRole,
    };

    const session = getStoredSession();
    if (session) {
      session.user = updatedUser;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    set({
      activeArea: targetArea,
      user: updatedUser,
      simulatedRole: null,
      pendingAreaSwitch: null,
      roleRestorationValidated: true,
    });

    const isRestored = get().user?.role === originalRole && get().simulatedRole === null;

    return {
      success: isRestored,
      restoredRole: originalRole,
      areaName: targetArea.name,
    };
  },

  cancelPendingAreaSwitch: () => {
    set({ pendingAreaSwitch: null });
  },

  clearRestorationValidation: () => {
    set({ roleRestorationValidated: false });
  },

  setSimulatedRole: (role) => {
    const current = get().user;
    if (!current) return;
    const homeRole = current.home_role || current.role;
    const effectiveRole = role || homeRole;

    const updatedUser = {
      ...current,
      home_role: homeRole,
      role: effectiveRole,
    };

    const session = getStoredSession();
    if (session) {
      session.user = updatedUser;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    set({
      user: updatedUser,
      simulatedRole: role,
      roleRestorationValidated: role === null,
    });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const homeRole = partial.home_role || current.home_role || partial.role || current.role;
    const activeSimulation = get().simulatedRole;

    const updated = {
      ...current,
      ...partial,
      home_role: homeRole,
      role: activeSimulation || homeRole,
    };
    const session = getStoredSession();
    if (session) {
      session.user = updated;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    set({ user: updated });
  },

  logout: () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_AREA_KEY);
    set({ user: null, token: null, refreshToken: null, activeArea: null });
  },

  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  },

  canAccessPage: (page) => {
    const user = get().user;
    if (!user) return false;
    // National coordinator and area servant have full admin access
    if (user.role === 'national_coordinator' || user.role === 'area_servant') return true;
    if (page === 'member') return user.role === 'member';
    return true;
  },
}));
