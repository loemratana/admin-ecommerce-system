import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  getUsers,
  updateUser,
  updateUserPassword,
} from "@/features/users/api/users.api";
import type { UpdatePasswordRequest, UpdateUserPayload, UserAdminPayload, UserQuery } from "@/features/users/types/user.types";

export const userKeys = {
  all: ["users"] as const,
  list: (query: UserQuery) => [...userKeys.all, "list", query] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
};

export function useUsers(query: UserQuery = {}) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: async () => (await getUsers(query)).data.data,
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => (await getUserById(id)).data.data,
    enabled: Number.isFinite(id),
  });
}

/** One-off lookup triggered by the search box, so it is a mutation rather than a cached query. */
export function useFindUserByEmail() {
  return useMutation({ mutationFn: (email: string) => getUserByEmail(email) });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserAdminPayload) => createUser(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) => updateUser(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePasswordRequest }) => updateUserPassword(id, payload),
  });
}

export function useDeleteUser() {
  return useMutation({ mutationFn: (id: number) => deleteUser(id) });
}
