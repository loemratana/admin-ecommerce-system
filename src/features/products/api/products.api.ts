import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { Page, ProductQuery, ProductRequest, ProductResponse, ProductStatsResponse } from "@/features/products/types/product.types";

// Note: unlike every other module, /api/v1/product returns raw payloads
// (no { success, message, data } envelope) - see api-design.md section 9.

export function getProducts(query: ProductQuery = {}) {
  return api.get<Page<ProductResponse>>(ENDPOINTS.products.base, { params: query });
}

export function getProductStats() {
  return api.get<ProductStatsResponse>(ENDPOINTS.products.stats);
}

export function getProduct(id: number) {
  return api.get<ProductResponse>(ENDPOINTS.products.byId(id));
}

export function createProduct(payload: ProductRequest) {
  return api.post<ProductResponse>(ENDPOINTS.products.base, payload);
}

export function updateProduct(id: number, payload: ProductRequest) {
  return api.put<ProductResponse>(ENDPOINTS.products.byId(id), payload);
}

// DELETE archives: the product disappears from the shop but orders and stock history keep it.
export function archiveProduct(id: number) {
  return api.delete<void>(ENDPOINTS.products.byId(id));
}

export function restoreProduct(id: number) {
  return api.post<void>(ENDPOINTS.products.restore(id));
}
