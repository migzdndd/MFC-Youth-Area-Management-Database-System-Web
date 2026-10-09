export interface Chapter {
  id: string;
  area_id: string;
  name: string;
  head_member_id?: string | null;
  head_name?: string | null;
  member_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Household {
  id: string;
  chapter_id: string;
  name: string;
  leader_member_id?: string | null;
  leader_name?: string | null;
  members?: string[];
}
