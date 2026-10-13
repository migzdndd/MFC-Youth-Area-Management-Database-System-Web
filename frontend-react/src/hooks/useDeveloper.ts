import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface SystemMemory {
  rssMb: number;
  heapTotalMb: number;
  heapUsedMb: number;
  externalMb: number;
}

export interface DeveloperMetrics {
  ok: boolean;
  authorizedUser: string;
  timestamp: string;
  system: {
    status: string;
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
    arch: string;
    env: string;
    dbLatencyMs: number;
    memory: SystemMemory;
  };
  counts: {
    members: number;
    chapters: number;
    areas: number;
    events: number;
    participants: number;
    reports: number;
    services: number;
    profiles: number;
  };
  recentActivity: {
    members: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      status: string;
      created_at: string;
      area_id?: string;
    }>;
    events: Array<{
      id: string;
      name: string;
      venue: string;
      fee: number;
      starts_at: string;
      created_at: string;
      created_by?: string;
    }>;
    reports: Array<{
      id: string;
      report_type: string;
      status: string;
      created_at: string;
      chapter_id?: string;
    }>;
  };
}

export function useDeveloperMetrics() {
  return useQuery({
    queryKey: ['developer-metrics'],
    queryFn: () => apiClient<DeveloperMetrics>('/dev'),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // 30 seconds auto-refresh
  });
}

export function useInspectTable() {
  return useMutation({
    mutationFn: (table: string) =>
      apiClient<{ ok: boolean; table: string; rows: Record<string, unknown>[] }>('/dev', {
        method: 'POST',
        body: JSON.stringify({ action: 'inspect_table', table }),
      }),
  });
}

export function useDevPing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<{ ok: boolean; latencyMs: number; timestamp: string }>('/dev', {
        method: 'POST',
        body: JSON.stringify({ action: 'ping' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-metrics'] });
    },
  });
}
