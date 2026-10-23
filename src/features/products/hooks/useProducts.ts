import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { archiveProduct, createProduct, getProduct, getProducts, getProductStats, restoreProduct, updateProduct } from "@/features/products/api/products.api";
import type { ProductQuery, ProductRequest } from "@/features/products/types/product.types";
import { brandKeys } from "@/features/brands/hooks/useBrands";
import { subCategoryKeys } from "@/features/sub-categories/hooks/useSubCategories";

export const productKeys = {
  all: ["products"] as const,
  list: (query: ProductQuery) => [...productKeys.all, "list", query] as const,
  detail: (id: number) => [...productKeys.all, "detail", id] as const,
  stats: () => [...productKeys.all, "stats"] as const,
};

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: async () => (await getProducts(query)).data,
    placeholderData: keepPreviousData,
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: async () => (await getProductStats()).data,
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: productKeys.detail(id ?? 0),
    queryFn: async () => (await getProduct(id as number)).data,
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Products feed brand product lists and sub-category product counts, so refresh those too. */
function invalidateProductLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: productKeys.all }),
    queryClient.invalidateQueries({ queryKey: brandKeys.all }),
    queryClient.invalidateQueries({ queryKey: subCategoryKeys.all }),
  ]);
}

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: ProductRequest }) =>
      id === null ? createProduct(payload) : updateProduct(id, payload),
    onSuccess: () => invalidateProductLists(queryClient),
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, restore }: { id: number; restore?: boolean }) => (restore ? restoreProduct(id) : archiveProduct(id)),
    onSuccess: () => invalidateProductLists(queryClient),
  });
}
