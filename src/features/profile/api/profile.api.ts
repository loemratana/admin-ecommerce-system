import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { Address, AddressPayload, UpdatePasswordRequest, UpdateProfileRequest, User } from "@/features/users/types/user.types";

// Current user (/api/v1/users/me)

export function getMe() {
  return api.get<ApiResponse<User>>(ENDPOINTS.users.me);
}

export function updateMe(payload: UpdateProfileRequest) {
  return api.patch<ApiResponse<User>>(ENDPOINTS.users.me, payload);
}

// Any signed-in user can call this (unlike /api/v1/images, which is admin only); it saves the avatar and returns the updated user.
// Content-Type must be overridden - the client defaults to JSON, which would serialize the FormData.
export function uploadMyAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);
  return api.post<ApiResponse<User>>(ENDPOINTS.users.meAvatar, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function updateMePassword(payload: UpdatePasswordRequest) {
  return api.patch<ApiResponse<null>>(ENDPOINTS.users.mePassword, payload);
}

export function deactivateMe() {
  return api.delete<ApiResponse<null>>(ENDPOINTS.users.me);
}

// Addresses (/api/v1/users/me/addresses)

export function getMyAddresses() {
  return api.get<ApiResponse<Address[]>>(ENDPOINTS.users.myAddresses);
}

export function getMyAddress(id: number) {
  return api.get<ApiResponse<Address>>(ENDPOINTS.users.myAddress(id));
}

export function addMyAddress(payload: AddressPayload) {
  return api.post<ApiResponse<Address>>(ENDPOINTS.users.myAddresses, payload);
}

export function updateMyAddress(id: number, payload: AddressPayload) {
  return api.patch<ApiResponse<Address>>(ENDPOINTS.users.myAddress(id), payload);
}

export function deleteMyAddress(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.users.myAddress(id));
}

export function setDefaultAddress(id: number) {
  return api.patch<ApiResponse<Address>>(ENDPOINTS.users.myAddressDefault(id));
}
