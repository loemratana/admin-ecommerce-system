import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { ProductReview, ReviewPage, ReviewPayload, ReviewQuery } from "@/features/reviews/types/review.types";

export function getReviews(query: ReviewQuery = {}) {
  return api.get<ApiResponse<ReviewPage<ProductReview>>>(ENDPOINTS.reviews.base, { params: query });
}

export function getProductReviews(productId: number) {
  return api.get<ApiResponse<ProductReview[]>>(ENDPOINTS.reviews.byProduct(productId));
}

export function createProductReview(productId: number, payload: ReviewPayload) {
  return api.post<ApiResponse<ProductReview>>(ENDPOINTS.reviews.byProduct(productId), payload);
}

export function getMyReviews() {
  return api.get<ApiResponse<ProductReview[]>>(ENDPOINTS.reviews.me);
}

export function updateReview(id: number, payload: ReviewPayload) {
  return api.put<ApiResponse<ProductReview>>(ENDPOINTS.reviews.byId(id), payload);
}

export function deleteReview(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.reviews.byId(id));
}
