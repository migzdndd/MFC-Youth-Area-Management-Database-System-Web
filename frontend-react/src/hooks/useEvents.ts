import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { CommunityEvent, Participant } from '@/types/event';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; data?: CommunityEvent[]; events?: CommunityEvent[] }>('/events');
      return res.data || res.events || [];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEvent: Partial<CommunityEvent>) =>
      apiClient<{ ok: boolean; data: CommunityEvent }>('/events', {
        method: 'POST',
        body: JSON.stringify(newEvent),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useEventParticipants(eventId: string) {
  return useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const res = await apiClient<{ ok: boolean; data?: Participant[]; participants?: Participant[] }>(
        `/participants?event_id=${encodeURIComponent(eventId)}`
      );
      return res.data || res.participants || [];
    },
    enabled: Boolean(eventId),
  });
}

export function useUpdateParticipantAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { event_id: string; member_id: string; attended: boolean }) =>
      apiClient<{ ok: boolean }>('/participants', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-participants', variables.event_id] });
    },
  });
}
