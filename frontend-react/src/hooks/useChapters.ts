import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Chapter } from '@/types/chapter';

export function useChapters() {
  const { token, user, activeArea } = useAuthStore();
  const currentAreaId = activeArea?.id || user?.area_id || '';
  return useQuery({
    queryKey: ['chapters', currentAreaId],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; data?: Chapter[]; chapters?: Chapter[] }>('/chapters');
      return res.data || res.chapters || [];
    },
    enabled: Boolean(token && user),
    retry: false,
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newChapter: { name: string; head_member_id?: string | null }) =>
      apiClient<{ ok: boolean; data: Chapter }>('/chapters', {
        method: 'POST',
        body: JSON.stringify(newChapter),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chapter: Partial<Chapter> & { id: string }) =>
      apiClient<{ ok: boolean; data: Chapter }>('/chapters', {
        method: 'PUT',
        body: JSON.stringify(chapter),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ ok: boolean }>('/chapters', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}
