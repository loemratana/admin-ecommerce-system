import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBrand, deleteBrand, getBrand, getBrands, updateBrand } from "@/features/brands/api/brands.api";
import type { BrandPayload } from "@/features/brands/types/brand.types";

export const brandKeys = {
  all: ["brands"] as const,
  list: () => [...brandKeys.all, "list"] as const,
  detail: (id: number) => [...brandKeys.all, "detail", id] as const,
};

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.list(),
    // Rarely-changing lookup data; create/update/delete invalidate it.
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const payload = (await getBrands()).data.data;
      return Array.isArray(payload) ? payload : [];
    },
  });
}

export function useBrand(id: number) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: async () => (await getBrand(id)).data.data,
    enabled: Number.isFinite(id),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BrandPayload) => createBrand(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.all }),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BrandPayload }) => updateBrand(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.all }),
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBrand(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.list() }),
  });
}
