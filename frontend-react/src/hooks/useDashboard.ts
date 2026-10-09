import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Area } from '@/types/auth';

export interface DashboardMetrics {
  totalMembers: number;
  totalChapters: number;
  upcomingEvents: number;
  totalReports: number;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // Fetch aggregate lists concurrently
      const [membersRes, chaptersRes, eventsRes, reportsRes] = await Promise.allSettled([
        apiClient<{ data: unknown[] }>('/members'),
        apiClient<{ data: unknown[] }>('/chapters'),
        apiClient<{ data: unknown[] }>('/events'),
        apiClient<{ data: unknown[] }>('/reports'),
      ]);

      const members = membersRes.status === 'fulfilled' ? membersRes.value?.data || [] : [];
      const chapters = chaptersRes.status === 'fulfilled' ? chaptersRes.value?.data || [] : [];
      const events = eventsRes.status === 'fulfilled' ? eventsRes.value?.data || [] : [];
      const reports = reportsRes.status === 'fulfilled' ? reportsRes.value?.data || [] : [];

      return {
        totalMembers: members.length,
        totalChapters: chapters.length,
        upcomingEvents: events.length,
        totalReports: reports.length,
      };
    },
  });
}

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await apiClient<{ ok: boolean; data: Area[] }>('/areas');
      return res.data || [];
    },
  });
}
