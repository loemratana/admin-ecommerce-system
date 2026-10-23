import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPermission,
  deletePermission,
  getPermission,
  getPermissions,
  updatePermission,
} from "@/features/permissions/api/permissions.api";
import type {
  PermissionPayload,
  UpdatePermissionPayload,
} from "@/features/permissions/types/permission.types";
import { roleKeys } from "@/features/roles/hooks/useRoles";

export const permissionKeys = {
  all: ["permissions"] as const,
  list: () => [...permissionKeys.all, "list"] as const,
  detail: (id: number) => [...permissionKeys.all, "detail", id] as const,
};

export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: async () => (await getPermissions()).data.data,
  });
}

export function usePermission(id: number) {
  return useQuery({
    queryKey: permissionKeys.detail(id),
    queryFn: async () => (await getPermission(id)).data.data,
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PermissionPayload) => createPermission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePermissionPayload }) =>
      updatePermission(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      queryClient.invalidateQueries({ queryKey: permissionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
