import type { Permission } from "@/features/permissions/types/permission.types";
import type { ApiResponse } from "@/lib/api/types";

export interface RoleDetail {
  roleId: number;
  roleName: string;
  active: boolean;
  description: string | null;
  permissions: Permission[];
}

export interface RolePayload {
  roleName: string;
  active?: boolean;
  description?: string;
}

export interface AssignPermissionsPayload {
  permissionIds: number[];
}

export type RoleResponse = ApiResponse<RoleDetail>;
export type RolesResponse = ApiResponse<RoleDetail[]>;
