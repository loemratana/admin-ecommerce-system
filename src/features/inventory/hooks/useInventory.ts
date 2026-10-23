import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustInventory,
  getInventory,
  getInventoryDetail,
  getInventoryStats,
  getInventoryTransactions,
  getLowStock,
  restockInventory,
} from "@/features/inventory/api/inventory.api";
import type { AdjustStockPayload, InventoryQuery, RestockPayload } from "@/features/inventory/types/inventory.types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  list: (query: InventoryQuery) => [...inventoryKeys.all, "list", query] as const,
  stats: () => [...inventoryKeys.all, "stats"] as const,
  lowStock: (threshold: number, size: number) => [...inventoryKeys.all, "low-stock", threshold, size] as const,
  detail: (variantId: number) => [...inventoryKeys.all, "detail", variantId] as const,
  transactions: (variantId: number, page: number) => [...inventoryKeys.all, "transactions", variantId, page] as const,
};

export function useInventory(query: InventoryQuery) {
  return useQuery({
    queryKey: inventoryKeys.list(query),
    queryFn: async () => (await getInventory(query)).data.data,
    placeholderData: keepPreviousData,
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: async () => (await getInventoryStats()).data.data,
  });
}

export function useLowStock(threshold = 10, size = 5) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(threshold, size),
    queryFn: async () => (await getLowStock(threshold, size)).data.data,
  });
}

export function useInventoryDetail(variantId: number) {
  return useQuery({
    queryKey: inventoryKeys.detail(variantId),
    queryFn: async () => (await getInventoryDetail(variantId)).data.data,
    enabled: Number.isFinite(variantId),
  });
}

export function useInventoryTransactions(variantId: number, page: number) {
  return useQuery({
    queryKey: inventoryKeys.transactions(variantId, page),
    queryFn: async () => (await getInventoryTransactions(variantId, page)).data.data,
    enabled: Number.isFinite(variantId),
    placeholderData: keepPreviousData,
  });
}

/** Either a restock (PURCHASE) or a manual adjustment, depending on what the dialog decided. */
export type StockChange =
  | { kind: "restock"; variantId: number; payload: RestockPayload }
  | { kind: "adjust"; variantId: number; payload: AdjustStockPayload };

export function useChangeStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (change: StockChange) =>
      change.kind === "restock"
        ? restockInventory(change.variantId, change.payload)
        : adjustInventory(change.variantId, change.payload),
    // Every list, stat card and history view can change, so refresh the whole inventory cache.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}
