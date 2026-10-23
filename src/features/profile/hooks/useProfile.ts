import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMyAddress,
  deleteMyAddress,
  getMe,
  getMyAddresses,
  setDefaultAddress,
  updateMe,
  updateMyAddress,
  updateMePassword,
  uploadMyAvatar,
} from "@/features/profile/api/profile.api";
import { storeUser } from "@/features/auth/store/auth.store";
import type { AddressPayload, UpdatePasswordRequest, UpdateProfileRequest } from "@/features/users/types/user.types";

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
  addresses: () => [...profileKeys.all, "addresses"] as const,
};

/** Loads the signed-in user and mirrors it into the auth store, which the header and profile card read from. */
export function useMe() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async () => {
      const user = (await getMe()).data.data;
      storeUser(user);
      return user;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateMe(payload),
    onSuccess: (response) => {
      storeUser(response.data.data);
      return queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file),
    onSuccess: (response) => {
      storeUser(response.data.data);
      return queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: (payload: UpdatePasswordRequest) => updateMePassword(payload) });
}

export function useMyAddresses() {
  return useQuery({ queryKey: profileKeys.addresses(), queryFn: async () => (await getMyAddresses()).data.data });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddressPayload) => addMyAddress(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.addresses() }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AddressPayload }) => updateMyAddress(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.addresses() }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMyAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.addresses() }),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.addresses() }),
  });
}
