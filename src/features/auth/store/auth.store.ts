import { create } from "zustand";
import { isAxiosError } from "axios";
import type { Device, LoginRequest, RegisterRequest } from "@/features/auth/types/auth.types";
import type { User } from "@/features/users/types/user.types";
import {
  login as loginRequest,
  logout as logoutRequest,
  logoutAll as logoutAllRequest,
  refreshToken as refreshTokenRequest,
  register as registerRequest,
  getDevices,
  revokeDevice,
} from "@/features/auth/api/auth.api";

const ACCESS_TOKEN_KEY = "ecommerce.access-token";
const REFRESH_TOKEN_KEY = "ecommerce.refresh-token";
const USER_KEY = "ecommerce.user";
const EMAIL_KEY = "ecommerce.account-email";

let sessionCheck: Promise<void> | null = null;

function read<T>(key: string): T | null {
  const value = window.localStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

function persist(key: string, value: unknown) {
  window.localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

function clearPersistedAuth() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export interface AuthState {
  user: User | null;
  email: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** False until a stored session has been verified with the server on startup. */
  isSessionChecked: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadCurrentSession: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: read<User>(USER_KEY),
  email: read<string>(EMAIL_KEY),
  accessToken: read<string>(ACCESS_TOKEN_KEY),
  isAuthenticated: Boolean(read<string>(ACCESS_TOKEN_KEY)),
  isLoading: false,
  isSessionChecked: !read<string>(ACCESS_TOKEN_KEY),

  setTokens: (accessToken, refreshToken) => {
    persist(ACCESS_TOKEN_KEY, accessToken);
    persist(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, isAuthenticated: true, isSessionChecked: true });
  },

  clearAuth: () => {
    clearPersistedAuth();
    window.localStorage.removeItem(EMAIL_KEY);
    set({ user: null, email: null, accessToken: null, isAuthenticated: false, isSessionChecked: true });
  },

  login: async (request) => {
    set({ isLoading: true });
    try {
      const response = await loginRequest(request);
      get().setTokens(response.data.data.accessToken, response.data.data.refreshToken);
      persist(EMAIL_KEY, request.email);
      set({ email: request.email });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (request) => {
    set({ isLoading: true });
    try {
      const response = await registerRequest(request);
      set({ isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  refreshToken: async () => {
    const refreshToken = read<string>(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error("No refresh token available");
    const response = await refreshTokenRequest(refreshToken);
    get().setTokens(response.data.data.accessToken, response.data.data.refreshToken);
  },

  loadCurrentSession: () => {
    // Shared so StrictMode's double effect (or several guards) only hit the server once.
    sessionCheck ??= (async () => {
      // Any authenticated request succeeding proves the session is valid. (Don't look at
      // device.current: the API only sets it when ?currentDeviceId= is passed.)
      try {
        try {
          await getDevices();
        } catch (error) {
          // Auth endpoints skip the refresh interceptor, so retry once with a fresh token here.
          if (!isAxiosError(error) || error.response?.status !== 401) throw error;
          await get().refreshToken();
          await getDevices();
        }
      } catch (error) {
        // Only drop the session when the token is rejected (401). A 403 means the token was accepted
        // but lacks a permission; network or server errors say nothing about the session.
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status === 401 || (error instanceof Error && error.message === "No refresh token available")) get().clearAuth();
      } finally {
        set({ isSessionChecked: true });
        sessionCheck = null;
      }
    })();
    return sessionCheck;
  },

  logout: async () => {
    try {
      const storedRefreshToken = read<string>(REFRESH_TOKEN_KEY);
      if (storedRefreshToken) await logoutRequest(storedRefreshToken);
    } finally {
      get().clearAuth();
    }
  },

  logoutAll: async () => {
    try {
      await logoutAllRequest();
    } finally {
      get().clearAuth();
    }
  },
}));

export function getStoredAccessToken() {
  return read<string>(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return read<string>(REFRESH_TOKEN_KEY);
}

export function storeUser(user: User) {
  persist(USER_KEY, user);
  useAuthStore.setState({ user });
}

export async function revokeStoredDevice(deviceId: string) {
  return revokeDevice(deviceId);
}

export type { Device };