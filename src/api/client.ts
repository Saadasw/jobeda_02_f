import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/env';
import { useAuthStore } from '@/auth/authStore';

/**
 * Shared API client.
 * - `withCredentials` so the httpOnly refresh cookie is sent/received.
 * - Request interceptor attaches the in-memory access token.
 * - Response interceptor performs single-flight token rotation on 401.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Only ONE refresh may be in flight: the backend rotates (revokes) the refresh
// token, so concurrent refreshes would revoke each other and cascade to logout.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  // Bare axios (no interceptors) to avoid recursion. The cookie carries the token.
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  useAuthStore.getState().setSession(data.access_token, data.user);
  return data.access_token as string;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = runRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        // Re-run the request: the request interceptor attaches the new token.
        return api(original);
      } catch (refreshError) {
        useAuthStore.getState().clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
