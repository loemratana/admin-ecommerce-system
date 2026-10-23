import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type {
  Permission,
  PermissionPayload,
  UpdatePermissionPayload,
} from "@/features/permissions/types/permission.types";

/**
 * GET /api/v1/permissions
 * Retrieve all system permissions
 */
export function getPermissions() {
  return api.get<ApiResponse<Permission[]>>(ENDPOINTS.permissions.base);
}

/**
 * GET /api/v1/permissions/{id}
 * Retrieve permission by ID
 */
export function getPermission(id: number) {
  return api.get<ApiResponse<Permission>>(ENDPOINTS.permissions.byId(id));
}

/**
 * POST /api/v1/permissions
 * Create a new permission
 */
export function createPermission(payload: PermissionPayload) {
  return api.post<ApiResponse<Permission>>(ENDPOINTS.permissions.base, payload);
}

/**
 * PUT /api/v1/permissions/{id}
 * Update an existing permission by ID
 */
export function updatePermission(id: number, payload: UpdatePermissionPayload) {
  return api.put<ApiResponse<Permission>>(ENDPOINTS.permissions.byId(id), payload);
}

/**
 * DELETE /api/v1/permissions/{id}
 * Delete a permission by ID
 */
export function deletePermission(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.permissions.byId(id));
}

