import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Member, MemberFilter, AcademicTrack } from '@/types/member';

export interface UpdateMemberInput extends Partial<Member> {
  id: string;
  track?: AcademicTrack | string | null;
}

export function useMembers(filters?: MemberFilter) {
  const { token, user, activeArea } = useAuthStore();
  const currentAreaId = activeArea?.id || user?.area_id || '';
  return useQuery({
    queryKey: ['members', currentAreaId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.chapter_id) params.set('chapter_id', filters.chapter_id);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.academic_track) params.set('track', filters.academic_track);

      const qs = params.toString();
      const endpoint = qs ? `/members?${qs}` : '/members';
      const res = await apiClient<{ ok: boolean; data?: Member[]; members?: Member[] }>(endpoint);
      return res.data || res.members || [];
    },
    enabled: Boolean(token && user),
    retry: false,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newMember: Partial<Member>) =>
      apiClient<{ ok: boolean; data?: Member; member?: Member }>('/members', {
        method: 'POST',
        body: JSON.stringify(newMember),
      }),
    onSuccess: (res) => {
      const created = res.data || (res as unknown as { member?: Member }).member;
      if (created) {
        queryClient.setQueriesData({ queryKey: ['members'] }, (old: Member[] | undefined) => {
          if (!old || !Array.isArray(old)) return [created];
          if (old.some((m) => m.id === created.id)) return old;
          return [created, ...old];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['members'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['chapters'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], refetchType: 'all' });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (member: UpdateMemberInput) =>
      apiClient<{ ok: boolean; data?: Member; member?: Member }>('/members', {
        method: 'PUT',
        body: JSON.stringify(member),
      }),
    onMutate: async (newMember: UpdateMemberInput) => {
      // 1. Cancel in-flight queries so they don't overwrite optimistic state
      await queryClient.cancelQueries({ queryKey: ['members'] });

      // 2. Snapshot previous cache entries across any filtered member queries
      const previousQueries = queryClient.getQueriesData<Member[]>({ queryKey: ['members'] });

      // 3. Optimistically update all matching members queries immediately
      queryClient.setQueriesData({ queryKey: ['members'] }, (old: Member[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((m) => {
          if (m.id !== newMember.id) return m;
          return {
            ...m,
            ...newMember,
            contact: newMember.contact || newMember.contact_number || m.contact,
            contact_number: newMember.contact || newMember.contact_number || m.contact_number,
            service: newMember.service !== undefined ? newMember.service : m.service,
            assigned_services: newMember.service
              ? [newMember.service]
              : (newMember.assigned_services || m.assigned_services),
            status: newMember.status || m.status,
            academic_track: newMember.academic_track || newMember.track || m.academic_track,
            updated_at: new Date().toISOString(),
          };
        });
      });

      return { previousQueries };
    },
    onError: (_err, _newMember, context) => {
      // Roll back to previous snapshot if the network request fails
      if (context?.previousQueries) {
        for (const [queryKey, oldData] of context.previousQueries) {
          queryClient.setQueryData(queryKey, oldData);
        }
      }
    },
    onSuccess: (res, variables) => {
      const updated = res.data || (res as unknown as { member?: Member }).member;
      if (updated) {
        queryClient.setQueriesData({ queryKey: ['members'] }, (old: Member[] | undefined) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((m) => (m.id === variables.id ? { ...m, ...updated } : m));
        });
      }
    },
    onSettled: () => {
      // Silently revalidate active queries in the background without blocking the UI
      queryClient.invalidateQueries({ queryKey: ['members'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], refetchType: 'active' });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ ok: boolean }>('/members', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
    onSuccess: (_res, id) => {
      queryClient.setQueriesData({ queryKey: ['members'] }, (old: Member[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((m) => m.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ['members'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['chapters'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], refetchType: 'all' });
    },
  });
}
