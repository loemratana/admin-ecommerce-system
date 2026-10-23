import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { User } from "@/features/users/types/user.types";
import type { AuthResponse, Device, LoginRequest, RegisterRequest } from "@/features/auth/types/auth.types";

export function register(request: RegisterRequest) {
  return api.post<ApiResponse<User>>(ENDPOINTS.auth.register, request);
}

export function login(request: LoginRequest) {
  return api.post<ApiResponse<AuthResponse>>(ENDPOINTS.auth.login, request);
}

export function refreshToken(refreshTokenValue: string) {
  return api.post<ApiResponse<AuthResponse>>(ENDPOINTS.auth.refresh, { refreshToken: refreshTokenValue });
}

export function logout(refreshTokenValue: string) {
  return api.post<ApiResponse<null>>(ENDPOINTS.auth.logout, { refreshToken: refreshTokenValue });
}

export function logoutAll() {
  return api.post<ApiResponse<null>>(ENDPOINTS.auth.logoutAll);
}

export function getDevices() {
  return api.get<ApiResponse<Device[]>>(ENDPOINTS.auth.devices);
}

export function revokeDevice(deviceId: string) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.auth.device(deviceId));
}
