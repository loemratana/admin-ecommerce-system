import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { SubCategory, SubCategoryDetailResponse, SubCategoryPayload } from "@/features/sub-categories/types/sub-category.types";

export function getSubCategories() {
  return api.get<ApiResponse<SubCategory[]>>(ENDPOINTS.subCategories.base);
}

export function getSubCategory(id: number) {
  return api.get<ApiResponse<SubCategoryDetailResponse>>(ENDPOINTS.subCategories.byId(id));
}

export function createSubCategory(payload: SubCategoryPayload) {
  return api.post<ApiResponse<SubCategory>>(ENDPOINTS.subCategories.base, payload);
}

export function updateSubCategory(id: number, payload: SubCategoryPayload) {
  return api.put<ApiResponse<SubCategory>>(ENDPOINTS.subCategories.byId(id), payload);
}

export function deleteSubCategory(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.subCategories.byId(id));
}
