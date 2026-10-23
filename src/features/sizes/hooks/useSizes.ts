import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activateSize, createSize, deactivateSize, deleteSize, getSizes, updateSize } from "@/features/sizes/api/sizes.api";
import type { ProductSize, ProductSizePayload } from "@/features/sizes/types/size.types";

export const sizeKeys = {
  all: ["sizes"] as const,
  list: () => [...sizeKeys.all, "list"] as const,
};

export function useSizes() {
  return useQuery({
    queryKey: sizeKeys.list(),
    // Rarely-changing lookup data; create/update/delete invalidate it.
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const payload = (await getSizes()).data.data;
      return Array.isArray(payload) ? payload : [];
    },
  });
}

export function useCreateSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductSizePayload) => createSize(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sizeKeys.all }),
  });
}

export function useUpdateSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductSizePayload }) => updateSize(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sizeKeys.all }),
  });
}

export function useDeleteSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSize(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sizeKeys.all }),
  });
}

export function useToggleSizeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (size: ProductSize) => (size.active ? deactivateSize(size.id) : activateSize(size.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sizeKeys.all }),
  });
}
