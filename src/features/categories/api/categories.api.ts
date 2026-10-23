import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { Category, CategoryDetailResponse, CategoryPayload } from "@/features/categories/types/category.types";

export function getCategories() {
  return api.get<ApiResponse<Category[]>>(ENDPOINTS.categories.base);
}

export function getCategory(id: number) {
  return api.get<ApiResponse<Category>>(ENDPOINTS.categories.byId(id));
}

export function getCategoryDetail(id: number) {
  return api.get<ApiResponse<CategoryDetailResponse>>(ENDPOINTS.categories.detail(id));
}

export function createCategory(payload: CategoryPayload) {
  return api.post<ApiResponse<Category>>(ENDPOINTS.categories.base, payload);
}

export function updateCategory(id: number, payload: CategoryPayload) {
  return api.put<ApiResponse<Category>>(ENDPOINTS.categories.byId(id), payload);
}

export function deleteCategory(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.categories.byId(id));
}
