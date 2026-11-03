import type { InventoryResponse, InventoryStatus, InventoryTransactionType } from "@/features/inventory/types/inventory.types";
// Store currency from Settings / Localization; re-exported for existing imports.
export { formatPrice } from "@/lib/currency";

export const STATUS_LABEL: Record<InventoryStatus, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};

export const STATUS_CLASS: Record<InventoryStatus, string> = {
  IN_STOCK: "bg-green-600 text-white",
  LOW_STOCK: "bg-amber-500 text-white",
  OUT_OF_STOCK: "bg-red-600 text-white",
};

export const TRANSACTION_LABEL: Record<InventoryTransactionType, string> = {
  PURCHASE: "Stock Received",
  SALE: "Sale",
  RETURN: "Returned",
  ADJUSTMENT: "Stock Correction",
  DAMAGE: "Damaged",
  LOSS: "Lost",
};

/** "Black / M" style label; falls back gracefully when color or size is missing. */
export function variantLabel(item: InventoryResponse) {
  const parts = [item.variant?.color, item.variant?.size?.name].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Default";
}

/** Null when the product has no image; render with ProductImage to get a blank card. */
export function productImage(item: InventoryResponse): string | null {
  return item.product?.imageUrl || null;
}


export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString(undefined, withTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" });
}

/** "Today", "Yesterday", "3 days ago", otherwise a short date. */
export function formatRelative(value: string | null | undefined) {
  if (!value) return "—";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(value);
}
