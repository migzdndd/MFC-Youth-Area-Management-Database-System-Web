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
      apiClient<{ ok: boolean; data: Member }>('/members', {
        method: 'POST',
        body: JSON.stringify(newMember),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (member: Partial<Member> & { id: string }) =>
      apiClient<{ ok: boolean; data: Member }>('/members', {
        method: 'PUT',
        body: JSON.stringify(member),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}
