import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type {
  AssignPermissionsPayload,
  RoleDetail,
  RolePayload,
} from "@/features/roles/types/role.types";

/**
 * GET /api/v1/role
 * Retrieve all roles
 */
export function getRoles() {
  return api.get<ApiResponse<RoleDetail[]>>(ENDPOINTS.roles.base);
}

/**
 * GET /api/v1/role/{id}
 * Retrieve a role by ID with its permissions
 */
export function getRole(id: number) {
  return api.get<ApiResponse<RoleDetail>>(ENDPOINTS.roles.byId(id));
}

/**
 * POST /api/v1/role
 * Create a new role
 */
export function createRole(payload: RolePayload) {
  return api.post<ApiResponse<RoleDetail>>(ENDPOINTS.roles.base, payload);
}

/**
 * PUT /api/v1/role/{id}
 * Update an existing role by ID
 */
export function updateRole(id: number, payload: RolePayload) {
  return api.put<ApiResponse<RoleDetail>>(ENDPOINTS.roles.byId(id), payload);
}

/**
 * DELETE /api/v1/role/{id}
 * Delete a role by ID
 */
export function deleteRole(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.roles.byId(id));
}

/**
 * PUT /api/v1/role/{id}/permissions
 * Replace the full set of permissions assigned to a role
 */
export function assignPermissions(id: number, payload: AssignPermissionsPayload) {
  return api.put<ApiResponse<RoleDetail>>(ENDPOINTS.roles.permissions(id), payload);
}
