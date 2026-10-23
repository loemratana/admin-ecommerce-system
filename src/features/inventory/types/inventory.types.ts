// Mirrors the Spring DTOs in ecommerce-api/inventory/dto.

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryTransactionType = "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "DAMAGE" | "LOSS";

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface InventoryProductSummary {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface InventoryVariantSummary {
  id: number;
  color: string | null;
  size: { id: number; name: string } | null;
  sku: string;
  price: number;
  priceAfterDiscount: number | null;
  soldQuantity: number | null;
  /** ARCHIVED = removed from the product; kept for history, not sellable. */
  status?: "ACTIVE" | "ARCHIVED";
}

export interface InventoryResponse {
  id: number;
  product: InventoryProductSummary | null;
  variant: InventoryVariantSummary | null;
  price: number | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  soldQuantity: number | null;
  status: InventoryStatus;
  updatedAt: string;
}

export interface InventoryTransactionResponse {
  id: number;
  type: InventoryTransactionType;
  quantityChange: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  createdAt: string;
}

export interface InventoryDetailResponse {
  inventory: InventoryResponse;
  totalStockIn: number;
  totalStockOut: number;
  recentTransactions: InventoryTransactionResponse[];
}

export interface InventoryStatsResponse {
  totalVariants: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalUnits: number;
  reservedUnits: number;
  lowStockThreshold: number;
}

export interface InventoryQuery {
  search?: string;
  status?: InventoryStatus;
  page?: number;
  size?: number;
}

export interface RestockPayload {
  quantity: number;
  note?: string;
}

export interface AdjustStockPayload {
  type: Exclude<InventoryTransactionType, "PURCHASE" | "SALE">;
  quantityChange: number;
  note?: string;
}

// UI-only: what the admin picks in the adjustment dialog.
export type AdjustmentMode = "Add Stock" | "Remove Stock" | "Set Stock";
