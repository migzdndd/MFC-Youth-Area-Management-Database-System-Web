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
        apiClient<{ data?: unknown[]; members?: unknown[] }>('/members'),
        apiClient<{ data?: unknown[]; chapters?: unknown[] }>('/chapters'),
        apiClient<{ data?: unknown[]; events?: unknown[] }>('/events'),
        apiClient<{ data?: unknown[]; reports?: unknown[] }>('/reports'),
      ]);

      const members = membersRes.status === 'fulfilled' ? membersRes.value?.data || membersRes.value?.members || [] : [];
      const chapters = chaptersRes.status === 'fulfilled' ? chaptersRes.value?.data || chaptersRes.value?.chapters || [] : [];
      const events = eventsRes.status === 'fulfilled' ? eventsRes.value?.data || eventsRes.value?.events || [] : [];
      const reports = reportsRes.status === 'fulfilled' ? reportsRes.value?.data || reportsRes.value?.reports || [] : [];

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
      const res = await apiClient<{ ok: boolean; data?: Area[]; areas?: Area[] }>('/areas');
      return res.data || res.areas || [];
    },
  });
}
