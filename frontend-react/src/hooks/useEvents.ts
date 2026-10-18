import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { CommunityEvent, Participant } from '@/types/event';

export function useEvents() {
  const { token, user, activeArea } = useAuthStore();
  const currentAreaId = activeArea?.id || user?.area_id || '';
  return useQuery({
    queryKey: ['events', currentAreaId],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; data?: CommunityEvent[]; events?: CommunityEvent[] }>('/events');
      return res.data || res.events || [];
    },
    enabled: Boolean(token && user),
    retry: false,
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

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedEvent: Partial<CommunityEvent> & { id: string }) =>
      apiClient<{ ok: boolean; event: CommunityEvent }>('/events', {
        method: 'PATCH',
        body: JSON.stringify(updatedEvent),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ ok: boolean; deleted: boolean }>('/events', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
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

export function useRegisterParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      event_id: string;
      member_id?: string | null;
      non_member_name?: string | null;
      payment_status?: 'Paid' | 'Not Paid';
      attended?: boolean;
    }) =>
      apiClient<{ ok: boolean; participant: Participant }>('/participants', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-participants', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      event_id: string;
      payment_status?: 'Paid' | 'Not Paid';
      attended?: boolean;
      non_member_name?: string | null;
    }) =>
      apiClient<{ ok: boolean; participant: Participant }>('/participants', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-participants', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useDeleteParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; event_id: string }) =>
      apiClient<{ ok: boolean }>('/participants', {
        method: 'DELETE',
        body: JSON.stringify({ id: payload.id }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-participants', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}
