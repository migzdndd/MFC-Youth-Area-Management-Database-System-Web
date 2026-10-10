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
  member_id?: string | null;
  non_member_name?: string | null;
  payment_status: 'Paid' | 'Not Paid' | 'Unpaid' | 'Waived';
  mode_of_payment?: 'Cash' | 'GCash' | 'Bank Transfer' | 'Other' | null;
  attended: boolean;
  member?: {
    first_name: string;
    last_name: string;
    academic_track?: string | null;
    chapter_name?: string | null;
  };
  created_at?: string;
  registered_at?: string;
}
