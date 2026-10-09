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
  area_id: string;
  area_name?: string;
  chapter_id?: string | null;
  chapter_name?: string | null;
  member_id?: string | null;
  first_name?: string;
  last_name?: string;
  is_mfa_enabled?: boolean;
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
  national_coordinator: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings', 'changelogs'],
  area_servant: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings', 'changelogs'],
  couple_coordinator: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings', 'changelogs'],
  lit_servant: ['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings', 'changelogs'],
  campus_servant: ['dashboard', 'members', 'services', 'reports', 'events', 'readings', 'changelogs'],
  mfc_high_servant: ['dashboard', 'members', 'services', 'reports', 'events', 'readings', 'changelogs'],
  area_kids_servant: ['dashboard', 'members', 'reports', 'events', 'readings', 'changelogs'],
  chapter_servant: ['dashboard', 'chapters', 'reports', 'events', 'readings', 'changelogs'],
  member: ['member'],
};
