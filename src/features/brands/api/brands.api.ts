import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { Brand, BrandPayload } from "@/features/brands/types/brand.types";

export function getBrands() {
  return api.get<ApiResponse<Brand[]>>(ENDPOINTS.brands.base);
}

export function getBrand(id: number) {
  return api.get<ApiResponse<Brand>>(ENDPOINTS.brands.byId(id));
}

export function createBrand(payload: BrandPayload) {
  return api.post<ApiResponse<Brand>>(ENDPOINTS.brands.base, payload);
}

export function updateBrand(id: number, payload: BrandPayload) {
  return api.put<ApiResponse<Brand>>(ENDPOINTS.brands.byId(id), payload);
}

export function deleteBrand(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.brands.byId(id));
}
