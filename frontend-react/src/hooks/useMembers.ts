import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Member, MemberFilter } from '@/types/member';

export function useMembers(filters?: MemberFilter) {
  return useQuery({
    queryKey: ['members', filters],
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], refetchType: 'all' });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (member: Partial<Member> & { id: string }) =>
      apiClient<{ ok: boolean; data?: Member; member?: Member }>('/members', {
        method: 'PUT',
        body: JSON.stringify(member),
      }),
    onSuccess: (res, variables) => {
      const updated = res.data || (res as unknown as { member?: Member }).member || variables;
      queryClient.setQueriesData({ queryKey: ['members'] }, (old: Member[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((m) => (m.id === variables.id ? { ...m, ...variables, ...updated } : m));
      });
      queryClient.invalidateQueries({ queryKey: ['members'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], refetchType: 'all' });
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], refetchType: 'all' });
    },
  });
}
