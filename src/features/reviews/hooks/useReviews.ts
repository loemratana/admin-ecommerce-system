import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProductReview,
  deleteReview,
  getMyReviews,
  getProductReviews,
  getReviews,
  updateReview,
} from "@/features/reviews/api/reviews.api";
import type { ReviewPayload, ReviewQuery } from "@/features/reviews/types/review.types";

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (query: ReviewQuery) => [...reviewKeys.all, "list", query] as const,
  product: (productId: number) => [...reviewKeys.all, "product", productId] as const,
  me: () => [...reviewKeys.all, "me"] as const,
};

export function useReviews(query: ReviewQuery = {}) {
  return useQuery({
    queryKey: reviewKeys.list(query),
    queryFn: async () => (await getReviews(query)).data.data,
    placeholderData: keepPreviousData,
  });
}

export function useProductReviews(productId: number | null) {
  return useQuery({
    queryKey: reviewKeys.product(productId ?? 0),
    queryFn: async () => {
      const payload = (await getProductReviews(productId as number)).data.data;
      return Array.isArray(payload) ? payload : [];
    },
    enabled: productId !== null && Number.isFinite(productId),
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: reviewKeys.me(),
    queryFn: async () => {
      const payload = (await getMyReviews()).data.data;
      return Array.isArray(payload) ? payload : [];
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: ReviewPayload }) =>
      createProductReview(productId, payload),
    onSuccess: (_data, { productId }) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.product(productId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.me() });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReviewPayload }) => updateReview(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
  });
}
