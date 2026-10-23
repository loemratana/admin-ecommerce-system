import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCategory, deleteCategory, getCategoryDetail, getCategories, updateCategory } from "@/features/categories/api/categories.api";
import type {
  CategoryDetail,
  CategoryDetailResponse,
  CategoryDetailSubCategoryResponse,
  CategoryPayload,
} from "@/features/categories/types/category.types";

function toSubCategoryRow(item: CategoryDetailSubCategoryResponse) {
  const { id, name, slug } = "subCategory" in item ? item.subCategory : item;
  return { id, name, slug, productCount: item.products ? item.products.length : null };
}

function toCategoryDetail(raw: CategoryDetailResponse): CategoryDetail {
  return { ...raw, subCategories: (raw.subCategories ?? []).map(toSubCategoryRow) };
}

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
  detail: (id: number) => [...categoryKeys.all, "detail", id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    // Rarely-changing lookup data; create/update/delete invalidate it.
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const payload = (await getCategories()).data.data;
      return Array.isArray(payload) ? payload : [];
    },
  });
}

export function useCategoryDetail(id: number) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => toCategoryDetail((await getCategoryDetail(id)).data.data),
    enabled: Number.isFinite(id),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoryPayload }) => updateCategory(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}
