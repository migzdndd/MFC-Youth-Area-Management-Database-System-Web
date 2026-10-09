export interface CommunityEvent {
  id: string;
  area_id: string;
  name: string;
  starts_at: string;
  ends_at?: string | null;
  venue: string;
  fee: number;
  manual_attendance?: number | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Participant {
  id: string;
  event_id: string;
  member_id: string;
  payment_status: 'Paid' | 'Unpaid' | 'Waived';
  mode_of_payment?: 'Cash' | 'GCash' | 'Bank Transfer' | 'Other' | null;
  attended: boolean;
  member?: {
    first_name: string;
    last_name: string;
    academic_track?: string | null;
    chapter_name?: string | null;
  };
  created_at?: string;
}
