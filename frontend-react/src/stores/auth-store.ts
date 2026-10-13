import { create } from 'zustand';
import type { UserProfile, UserRole, Area } from '@/types/auth';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  activeArea: Area | null;
  simulatedRole: UserRole | null;
  isLoading: boolean;
  setSession: (session: { access_token: string; refresh_token: string; user: UserProfile } | null) => void;
  setActiveArea: (area: Area | null, role?: UserRole | null) => void;
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
  isLoading: false,

  setSession: (session) => {
    if (session) {
      const user = {
        ...session.user,
        home_role: session.user.home_role || session.user.role,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...session, user }));
      set({
        user,
        token: session.access_token,
        refreshToken: session.refresh_token,
        simulatedRole: null,
      });
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_AREA_KEY);
      set({ user: null, token: null, refreshToken: null, activeArea: null, simulatedRole: null });
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
      set({ activeArea: area, user: updatedUser, simulatedRole: null });
    } else {
      // Simulating or inspecting another area:
      // National coordinators keep their role, but area/lit/chapter servants do NOT stick to other areas
      const isNational = homeRole === 'national_coordinator';
      const effectiveRole: UserRole = isNational
        ? 'national_coordinator'
        : (roleOverride !== undefined && roleOverride !== null ? roleOverride : (get().simulatedRole || 'member'));

      const updatedUser = { ...current, home_role: homeRole, role: effectiveRole };
      set({ activeArea: area, user: updatedUser, simulatedRole: effectiveRole });
    }
  },

  setSimulatedRole: (role) => {
    const current = get().user;
    if (!current) return;
    const homeRole = current.home_role || current.role;
    const active = get().activeArea;
    const isHomeArea = !active || active.id === current.area_id;

    if (isHomeArea) {
      const effectiveRole = role || homeRole;
      set({ user: { ...current, home_role: homeRole, role: effectiveRole }, simulatedRole: role });
    } else {
      const effectiveRole = role || 'member';
      set({ user: { ...current, home_role: homeRole, role: effectiveRole }, simulatedRole: role });
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const homeRole = partial.home_role || current.home_role || partial.role || current.role;
    const active = get().activeArea;
    const isHomeArea = !active || active.id === (partial.area_id || current.area_id);

    const updated = {
      ...current,
      ...partial,
      home_role: homeRole,
      role: isHomeArea ? homeRole : (get().simulatedRole || 'member'),
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
