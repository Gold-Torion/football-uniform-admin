import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../store/auth.store';
import { Env } from '../utils/env';

const API_BASE_URL = Env.apiBaseUrl;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

/**
 * Single shared axios instance. Two interceptors:
 *
 *   1. Request — attach the bearer token whenever we have one.
 *   2. Response — on 401, attempt a single refresh-token rotation in flight,
 *      replay the original request, and on second failure clear the session
 *      and let the navigation root drop the user back to the sign-in screen.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

api.interceptors.request.use((req) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    req.headers.set('Authorization', `Bearer ${token}`);
  }
  return req;
});

let inFlightRefresh: Promise<string | null> | null = null;

async function runRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    const session = res.data as Parameters<ReturnType<typeof useAuthStore.getState>['setSession']>[0];
    if (!session?.user) return null;
    await useAuthStore.getState().setSession(session);
    return session.accessToken;
  } catch {
    await useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retried) {
      throw error;
    }
    original._retried = true;
    inFlightRefresh ??= runRefresh().finally(() => {
      inFlightRefresh = null;
    });
    const newToken = await inFlightRefresh;
    if (!newToken) throw error;
    original.headers.set('Authorization', `Bearer ${newToken}`);
    return api.request(original);
  },
);
