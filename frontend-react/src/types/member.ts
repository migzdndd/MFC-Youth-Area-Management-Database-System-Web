export type AcademicTrack = 'High School' | 'Senior High School' | 'College' | 'Working';
export type MemberStatus = 'active' | 'inactive';

export interface Member {
  id: string;
  area_id: string;
  chapter_id: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  nickname?: string | null;
  gender?: 'Male' | 'Female' | null;
  birthdate?: string | null;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  academic_track?: AcademicTrack | null;
  status: MemberStatus;
  guardian_name?: string | null;
  guardian_contact?: string | null;
  assigned_services?: string[] | null;
  created_at?: string;
  updated_at?: string;
  chapter_name?: string | null;
}

export interface MemberFilter {
  search?: string;
  chapter_id?: string;
  academic_track?: string;
  status?: string;
  service?: string;
}
