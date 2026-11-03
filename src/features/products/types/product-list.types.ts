export type ProductStatus = "Active" | "Archived" | "Draft" | "Inactive" | "Out of Stock";
export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  /** Product type label (Men / Women / Unisex), "—" when not set. */
  type: string;
  variants: number;
  colors: number;
  sizes: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  hasMixedDiscounts?: boolean;
  stock: number;
  skus: number;
  status: ProductStatus;
  stockStatus: StockStatus;
  updated: string;
  /** Null when the product has no images. */
  image: string | null;
  rating: number;
  ratingCount: number;
  colorSwatches: string[];
};

// Products are archived (hidden from the shop), never deleted: orders and stock history reference them.
export type ProductAction = "view" | "edit" | "archive" | "restore";

export type ProductViewMode = "table" | "grid";
