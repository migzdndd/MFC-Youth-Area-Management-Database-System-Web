import { useAuthStore } from '@/stores/auth-store';

export interface ApiResponse<T = unknown> {
  ok?: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { token, activeArea, user, logout, setSession } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const effectiveAreaId = activeArea?.id || user?.area_id;
  if (effectiveAreaId) {
    headers['x-area-id'] = effectiveAreaId;
  }

  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      logout();
      throw new ApiError('Session expired. Please sign in again.', 401);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const currentSession = {
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || refreshToken,
            user: useAuthStore.getState().user!,
          };
          setSession(currentSession);
          onRefreshed(refreshData.access_token);
          isRefreshing = false;

          // Retry original request with fresh token
          headers['Authorization'] = `Bearer ${refreshData.access_token}`;
          const retryRes = await fetch(url, { ...options, headers });
          return retryRes.json();
        } else {
          logout();
          throw new ApiError('Session expired. Please sign in again.', 401);
        }
      } catch (err) {
        logout();
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for refresh in flight
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push(async (newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          try {
            const retryRes = await fetch(url, { ...options, headers });
            resolve(await retryRes.json());
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }

  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === 'object' && 'error' in data ? (data as { error: string }).error : null) ||
      (data && typeof data === 'object' && 'message' in data ? (data as { message: string }).message : null) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}
