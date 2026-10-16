import { useAuthStore } from '@/stores/auth-store';
import { enqueueMutation } from './offlineQueue';

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
  const method = (options.method || 'GET').toUpperCase();
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const isExcludedFromQueue = endpoint.includes('/auth/') || endpoint.includes('/sync') || endpoint.includes('/health');

  let parsedPayload: unknown = null;
  if (isWrite && options.body && typeof options.body === 'string') {
    try {
      parsedPayload = JSON.parse(options.body);
    } catch {
      parsedPayload = options.body;
    }
  }

  // If browser is actively offline and it's an operational write request, queue it immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine && isWrite && !isExcludedFromQueue) {
    const queued = await enqueueMutation(endpoint, method, parsedPayload);
    return {
      ok: true,
      deferred: true,
      offlineQueued: true,
      id: queued.id,
      message: 'Network offline. Action queued for automatic synchronization.',
    } as T;
  }

  const { token, activeArea, user, logout, setSession } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const effectiveAreaId = activeArea?.id || user?.area_id;
  if (effectiveAreaId) {
    headers['x-area-id'] = effectiveAreaId;
    headers['x-mfc-area-id'] = effectiveAreaId;
  }

  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    // If request failed due to network dropout and it's a write operation, queue optimistically
    if (isWrite && !isExcludedFromQueue) {
      const queued = await enqueueMutation(endpoint, method, parsedPayload);
      return {
        ok: true,
        deferred: true,
        offlineQueued: true,
        id: queued.id,
        message: 'Network connection dropped. Action queued for automatic replay.',
      } as T;
    }
    throw netErr;
  }

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
          const newAccessToken = refreshData.access_token || refreshData.session?.accessToken || refreshData.session?.access_token;
          const newRefreshToken = refreshData.refresh_token || refreshData.session?.refreshToken || refreshData.session?.refresh_token || refreshToken;

          const currentSession = {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            user: useAuthStore.getState().user!,
          };
          setSession(currentSession);
          onRefreshed(newAccessToken);
          isRefreshing = false;

          // Retry original request with fresh token
          headers['Authorization'] = `Bearer ${newAccessToken}`;
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
