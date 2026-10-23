import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCustomer,
  getCustomerOrders,
  getCustomerReviews,
  getCustomers,
  getCustomerStats,
  setCustomerActive,
} from "@/features/customers/api/customers.api";
import type { CustomerQuery } from "@/features/customers/types/customer.types";
import { updateUser } from "@/features/users/api/users.api";
import { userKeys } from "@/features/users/hooks/useUsers";
import { uploadImage } from "@/lib/api/uploads";

export const customerKeys = {
  all: ["customers"] as const,
  list: (query: CustomerQuery) => [...customerKeys.all, "list", query] as const,
  stats: () => [...customerKeys.all, "stats"] as const,
  detail: (id: number) => [...customerKeys.all, "detail", id] as const,
  orders: (id: number, page: number, size: number) => [...customerKeys.all, "orders", id, page, size] as const,
  reviews: (id: number, page: number) => [...customerKeys.all, "reviews", id, page] as const,
};

export function useCustomers(query: CustomerQuery) {
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: async () => (await getCustomers(query)).data.data,
    placeholderData: keepPreviousData,
  });
}

export function useCustomerStats() {
  return useQuery({
    queryKey: customerKeys.stats(),
    queryFn: async () => (await getCustomerStats()).data.data,
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => (await getCustomer(id)).data.data,
    enabled: Number.isFinite(id),
  });
}

export function useCustomerOrders(id: number, page: number, size = 10) {
  return useQuery({
    queryKey: customerKeys.orders(id, page, size),
    queryFn: async () => (await getCustomerOrders(id, page, size)).data.data,
    enabled: Number.isFinite(id),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerReviews(id: number, page: number, enabled = true) {
  return useQuery({
    queryKey: customerKeys.reviews(id, page),
    queryFn: async () => (await getCustomerReviews(id, page)).data.data,
    enabled: enabled && Number.isFinite(id),
    placeholderData: keepPreviousData,
  });
}

/**
 * Sets (file) or removes (null) a customer's avatar. A customer is a user account, so the
 * image is uploaded via /images and saved with PUT /users/{id} (both admin only).
 */
export function useSetCustomerAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File | null }) => {
      const profilePicture = file ? (await uploadImage(file, "avatars")).data.url : "";
      return updateUser(id, { profilePicture });
    },
    onSuccess: () => {
      // Avatars show on the detail page and in the list
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useSetCustomerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => setCustomerActive(id, active),
    onSuccess: (response) => {
      const customer = response.data.data;
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      queryClient.invalidateQueries({ queryKey: [...customerKeys.all, "list"] });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
  });
}
