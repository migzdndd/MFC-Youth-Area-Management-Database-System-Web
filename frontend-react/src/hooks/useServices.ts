import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface ServiceItem {
  id: string;
  area_id: string;
  name: string;
  is_active: boolean;
}

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; services?: ServiceItem[]; data?: ServiceItem[] }>('/services');
      return res.services || res.data || [];
    },
  });
}
