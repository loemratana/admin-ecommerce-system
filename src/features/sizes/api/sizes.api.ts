import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { ProductSize, ProductSizePayload } from "@/features/sizes/types/size.types";

export function getSizes() {
  return api.get<ApiResponse<ProductSize[]>>(ENDPOINTS.sizes.base);
}

export function getSize(id: number) {
  return api.get<ApiResponse<ProductSize>>(ENDPOINTS.sizes.byId(id));
}

export function createSize(payload: ProductSizePayload) {
  return api.post<ApiResponse<ProductSize>>(ENDPOINTS.sizes.base, payload);
}

export function updateSize(id: number, payload: ProductSizePayload) {
  return api.put<ApiResponse<ProductSize>>(ENDPOINTS.sizes.byId(id), payload);
}

export function deleteSize(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.sizes.byId(id));
}

export function activateSize(id: number) {
  return api.patch<ApiResponse<ProductSize>>(ENDPOINTS.sizes.activate(id));
}

export function deactivateSize(id: number) {
  return api.patch<ApiResponse<ProductSize>>(ENDPOINTS.sizes.deactivate(id));
}
