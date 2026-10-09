import { create } from 'zustand';
import type { UserProfile, UserRole, Area } from '@/types/auth';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  activeArea: Area | null;
  isLoading: boolean;
  setSession: (session: { access_token: string; refresh_token: string; user: UserProfile } | null) => void;
  setActiveArea: (area: Area | null) => void;
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
  user: initialSession?.user || null,
  token: initialSession?.access_token || null,
  refreshToken: initialSession?.refresh_token || null,
  activeArea: initialArea || null,
  isLoading: false,

  setSession: (session) => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      set({
        user: session.user,
        token: session.access_token,
        refreshToken: session.refresh_token,
      });
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_AREA_KEY);
      set({ user: null, token: null, refreshToken: null, activeArea: null });
    }
  },

  setActiveArea: (area) => {
    if (area) {
      localStorage.setItem(ACTIVE_AREA_KEY, JSON.stringify(area));
    } else {
      localStorage.removeItem(ACTIVE_AREA_KEY);
    }
    set({ activeArea: area });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
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
