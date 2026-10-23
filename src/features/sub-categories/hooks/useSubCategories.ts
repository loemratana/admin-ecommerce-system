import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubCategory,
  deleteSubCategory,
  getSubCategories,
  getSubCategory,
  updateSubCategory,
} from "@/features/sub-categories/api/sub-categories.api";
import type {
  SubCategoryDetail,
  SubCategoryDetailResponse,
  SubCategoryPayload,
} from "@/features/sub-categories/types/sub-category.types";

function toSubCategoryDetail(raw: SubCategoryDetailResponse): SubCategoryDetail {
  const { categoryId, categoryName, category, products, ...rest } = raw;
  return {
    ...rest,
    category: category
      ? { ...category, id: category.id ?? categoryId ?? null }
      : categoryId != null
        ? { id: categoryId, name: categoryName ?? "", slug: "" }
        : null,
    products: products ?? [],
  };
}

export const subCategoryKeys = {
  all: ["sub-categories"] as const,
  list: () => [...subCategoryKeys.all, "list"] as const,
  detail: (id: number) => [...subCategoryKeys.all, "detail", id] as const,
};

export function useSubCategories() {
  return useQuery({
    queryKey: subCategoryKeys.list(),
    // Rarely-changing lookup data; create/update/delete invalidate it.
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const payload = (await getSubCategories()).data.data;
      return Array.isArray(payload) ? payload : [];
    },
  });
}

export function useSubCategory(id: number) {
  return useQuery({
    queryKey: subCategoryKeys.detail(id),
    queryFn: async () => toSubCategoryDetail((await getSubCategory(id)).data.data),
    enabled: Number.isFinite(id),
  });
}

export function useCreateSubCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubCategoryPayload) => createSubCategory(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subCategoryKeys.all }),
  });
}

export function useUpdateSubCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SubCategoryPayload }) => updateSubCategory(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subCategoryKeys.all }),
  });
}

export function useDeleteSubCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSubCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subCategoryKeys.list() }),
  });
}
