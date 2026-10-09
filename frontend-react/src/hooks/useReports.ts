import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ActivityReport } from '@/types/report';

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; data: ActivityReport[] }>('/reports');
      return res.data || [];
    },
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
