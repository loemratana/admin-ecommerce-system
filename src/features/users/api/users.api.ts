import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PageResponse } from "@/lib/api/types";
import type { UpdatePasswordRequest, UpdateUserPayload, User, UserAdminPayload, UserQuery } from "@/features/users/types/user.types";

export function getUsers(query: UserQuery = {}) {
  return api.get<ApiResponse<PageResponse<User>>>(ENDPOINTS.users.base, { params: query });
}

export function createUser(payload: UserAdminPayload) {
  return api.post<ApiResponse<User>>(ENDPOINTS.users.base, payload);
}

export function updateUser(id: number, payload: UpdateUserPayload) {
  return api.put<ApiResponse<User>>(ENDPOINTS.users.byId(id), payload);
}

export function updateUserPassword(id: number, payload: UpdatePasswordRequest) {
  return api.patch<ApiResponse<null>>(ENDPOINTS.users.password(id), payload);
}

export function getUserById(id: number) {
  return api.get<ApiResponse<User>>(ENDPOINTS.users.byId(id));
}

export function getUserByEmail(email: string) {
  return api.get<ApiResponse<User>>(ENDPOINTS.users.byEmail(email));
}

export function deleteUser(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.users.byId(id));
}
