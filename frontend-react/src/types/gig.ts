export interface GigContribution {
  id: string;
  area_id: string;
  chapter_id?: string | null;
  member_id: string;
  amount: number;
  contribution_date: string;
  notes?: string | null;
  recorded_by?: string | null;
  created_at?: string;
  member?: {
    first_name: string;
    last_name: string;
    chapter_name?: string | null;
  };
}

export interface GigSummary {
  total_collected: number;
  ytd_collected: number;
  mtd_collected: number;
  active_givers: number;
}
