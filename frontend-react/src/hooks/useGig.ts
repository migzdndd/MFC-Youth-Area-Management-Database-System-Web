import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { GigContribution } from '@/types/gig';

export function useGigRecords(month?: string) {
  const { token, user } = useAuthStore();
  return useQuery({
    queryKey: ['gig', month],
    queryFn: async () => {
      const endpoint = month ? `/gig?month=${encodeURIComponent(month)}` : '/gig';
      const res = await apiClient<{ ok: boolean; data?: GigContribution[]; gig?: GigContribution[] }>(endpoint);
      return res.data || res.gig || [];
    },
    enabled: Boolean(token && user),
    retry: false,
  });
}

export function useCreateGigRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newRecord: Partial<GigContribution>) =>
      apiClient<{ ok: boolean; data: GigContribution }>('/gig', {
        method: 'POST',
        body: JSON.stringify(newRecord),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gig'] });
    },
  });
}
