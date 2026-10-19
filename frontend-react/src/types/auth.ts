export type UserRole =
  | 'national_coordinator'
  | 'area_servant'
  | 'couple_coordinator'
  | 'lit_servant'
  | 'campus_servant'
  | 'mfc_high_servant'
  | 'area_kids_servant'
  | 'chapter_servant'
  | 'member';

export interface Area {
  id: string;
  name: string;
  passcode?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  home_role?: UserRole;
  area_id: string;
  area_name?: string;
  chapter_id?: string | null;
  chapter_name?: string | null;
  member_id?: string | null;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  is_mfa_enabled?: boolean;
  is_developer?: boolean;
  requiresAreaSelection?: boolean;
  requires_area_selection?: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: UserProfile;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  national_coordinator: 'National Coordinator',
  area_servant: 'Area Servant',
  couple_coordinator: 'Couple Coordinator',
  lit_servant: 'LIT Servant',
  campus_servant: 'Campus Servant',
  mfc_high_servant: 'MFC High Servant',
  area_kids_servant: 'Area Kids Servant',
  chapter_servant: 'Chapter Servant',
  member: 'Youth Member',
};

export const ROLE_ALLOWED_PAGES: Record<UserRole, string[]> = {
  national_coordinator: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'],
  area_servant: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'],
  couple_coordinator: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'],
  lit_servant: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'],
  campus_servant: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'],
  mfc_high_servant: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'],
  area_kids_servant: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'],
  chapter_servant: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'],
  member: ['member'],
};
