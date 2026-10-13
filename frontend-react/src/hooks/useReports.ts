import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { ActivityReport } from '@/types/report';

export function useReports() {
  const { token, user, activeArea } = useAuthStore();
  const currentAreaId = activeArea?.id || user?.area_id || '';
  return useQuery({
    queryKey: ['reports', currentAreaId],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; data?: ActivityReport[]; reports?: ActivityReport[] }>('/reports');
      return res.data || res.reports || [];
    },
    enabled: Boolean(token && user),
    retry: false,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newReport: Partial<ActivityReport>) =>
      apiClient<{ ok: boolean; data: ActivityReport }>('/reports', {
        method: 'POST',
        body: JSON.stringify(newReport),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}
