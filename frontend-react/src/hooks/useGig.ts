import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { GigContribution } from '@/types/gig';

export function useGigRecords(month?: string) {
  return useQuery({
    queryKey: ['gig', month],
    queryFn: async () => {
      const endpoint = month ? `/gig?month=${encodeURIComponent(month)}` : '/gig';
      const res = await apiClient<{ ok: boolean; data?: GigContribution[]; gig?: GigContribution[] }>(endpoint);
      return res.data || res.gig || [];
    },
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
