import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Area } from '@/types/auth';

import { useAuthStore } from '@/stores/auth-store';

export interface DashboardMetrics {
  totalMembers: number;
  totalChapters: number;
  upcomingEvents: number;
  totalReports: number;
}

export function useDashboardMetrics() {
  const { user, activeArea } = useAuthStore();
  const currentAreaId = activeArea?.id || user?.area_id || '';

  return useQuery({
    queryKey: ['dashboard-metrics', currentAreaId],
    queryFn: async () => {
      // 1. First attempt: fetch pre-aggregated dashboard counts from /sync
      try {
        const syncRes = await apiClient<{
          ok?: boolean;
          dashboard?: {
            members?: number;
            chapters?: number;
            events?: number;
            reports?: number;
          };
        }>('/sync');

        if (syncRes?.dashboard) {
          return {
            totalMembers: Number(syncRes.dashboard.members ?? 0),
            totalChapters: Number(syncRes.dashboard.chapters ?? 0),
            upcomingEvents: Number(syncRes.dashboard.events ?? 0),
            totalReports: Number(syncRes.dashboard.reports ?? 0),
          };
        }
      } catch {
        // Fall back to individual collection fetches
      }

      // 2. Fallback: Fetch aggregate lists concurrently
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
