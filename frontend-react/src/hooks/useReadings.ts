import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface ReadingItem {
  type: string;
  reference: string;
  text?: string;
}

export interface DailyReadingsData {
  ok: boolean;
  day: string;
  date: string;
  celebration: string;
  readings: ReadingItem[];
  source?: {
    name: string;
    url: string;
  };
}

export function useDailyReadings(targetDate?: string) {
  return useQuery({
    queryKey: ['daily-readings', targetDate],
    queryFn: async () => {
      // Default to Manila timezone date string
      const dateStr =
        targetDate ||
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());

      const res = await apiClient<DailyReadingsData>(`/daily-readings?date=${dateStr}`);
      return res;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
