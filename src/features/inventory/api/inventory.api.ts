import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type {
  AdjustStockPayload,
  InventoryDetailResponse,
  InventoryQuery,
  InventoryResponse,
  InventoryStatsResponse,
  InventoryTransactionResponse,
  PageResponse,
  RestockPayload,
} from "@/features/inventory/types/inventory.types";

export function getInventory(query: InventoryQuery = {}) {
  return api.get<ApiResponse<PageResponse<InventoryResponse>>>(ENDPOINTS.inventory.base, { params: query });
}

export function getInventoryStats() {
  return api.get<ApiResponse<InventoryStatsResponse>>(ENDPOINTS.inventory.stats);
}

export function getLowStock(threshold = 10, size = 5) {
  return api.get<ApiResponse<PageResponse<InventoryResponse>>>(ENDPOINTS.inventory.lowStock, {
    params: { threshold, size },
  });
}

export function getInventoryDetail(variantId: number) {
  return api.get<ApiResponse<InventoryDetailResponse>>(ENDPOINTS.inventory.detail(variantId));
}

export function getInventoryTransactions(variantId: number, page = 0, size = 20) {
  return api.get<ApiResponse<PageResponse<InventoryTransactionResponse>>>(ENDPOINTS.inventory.transactions(variantId), {
    params: { page, size },
  });
}

export function restockInventory(variantId: number, payload: RestockPayload) {
  return api.post<ApiResponse<InventoryResponse>>(ENDPOINTS.inventory.restock(variantId), payload);
}

export function adjustInventory(variantId: number, payload: AdjustStockPayload) {
  return api.post<ApiResponse<InventoryResponse>>(ENDPOINTS.inventory.adjust(variantId), payload);
}
