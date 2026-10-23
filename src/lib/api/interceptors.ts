import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getStoredAccessToken, getStoredRefreshToken, useAuthStore } from "@/features/auth/store/auth.store";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { ENDPOINTS } from "./endpoints";
import type { ApiResponse } from "./types";

let refreshPromise: Promise<string> | null = null;

export function setupInterceptors(api: AxiosInstance) {
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const accessToken = getStoredAccessToken();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      const isAuthRequest = originalRequest?.url?.includes(ENDPOINTS.auth.base);

      if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const storedRefreshToken = getStoredRefreshToken();
      if (!storedRefreshToken) {
        useAuthStore.getState().clearAuth();
        window.location.assign("/auth/login");
        return Promise.reject(error);
      }

      try {
        refreshPromise ??= api.post<ApiResponse<AuthResponse>>(ENDPOINTS.auth.refresh, { refreshToken: storedRefreshToken })
          .then((response) => {
            const next = response.data.data;
            useAuthStore.getState().setTokens(next.accessToken, next.refreshToken);
            return next.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });

        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.assign("/auth/login");
        return Promise.reject(refreshError);
      }
    },
  );
}
