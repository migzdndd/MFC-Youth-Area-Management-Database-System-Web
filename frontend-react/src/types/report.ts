export interface ActivityReport {
  id: string;
  area_id: string;
  chapter_id: string;
  chapter_name?: string | null;
  title: string;
  activity_date: string;
  participant_count: number;
  report_type: 'Chapter Assembly' | 'Household Meeting' | 'Community Service' | 'Special Event' | string;
  notes?: string | null;
  prepared_by?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
}
