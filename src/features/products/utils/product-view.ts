import type { ProductViewMode } from "@/features/products/types/product-list.types";

const STORAGE_KEY = "products:view";

export function readStoredView(): ProductViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "grid" ? "grid" : "table";
  } catch {
    return "table";
  }
}

export function storeView(mode: ProductViewMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable (private mode); the toggle still works for this session.
  }
}
