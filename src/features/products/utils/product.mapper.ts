import type { Product } from "@/features/products/types/product-list.types";
import type { ProductResponse } from "@/features/products/types/product.types";

export const PRODUCT_PLACEHOLDER_IMAGE = "/images/product/product-01.jpg";
// Same threshold the API uses for its low-stock stats.
const LOW_STOCK_THRESHOLD = 10;

export function toUiProduct(product: ProductResponse): Product {
  const variants = product.variants ?? [];
  const images = product.images ?? [];
  const prices = variants.map((variant) => Number(variant.priceAfterDiscount || variant.price)).filter((price) => price > 0);
  const cheapest = prices.length ? Math.min(...prices) : 0;
  const listPrice = variants.find((variant) => Number(variant.priceAfterDiscount || variant.price) === cheapest);
  const originalPrice = listPrice?.priceAfterDiscount && listPrice.priceAfterDiscount < listPrice.price ? listPrice.price : undefined;
  const stockTotal = variants.reduce((total, variant) => total + (variant.availableQuantity || 0), 0);
  const stockStatus: Product["stockStatus"] = stockTotal <= 0 ? "Out of Stock" : stockTotal <= LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock";
  const colors = new Set(variants.map((variant) => variant.color).filter(Boolean)).size;
  const sizes = new Set(variants.map((variant) => variant.size?.name).filter(Boolean)).size;

  return {
    id: String(product.id),
    name: product.title,
    sku: variants[0]?.sku || "—",
    category: product.subCategory?.subCategoryName || "—",
    brand: product.brand?.brandName || "—",
    variants: variants.length,
    colors,
    sizes,
    price: cheapest,
    originalPrice,
    stock: stockTotal,
    skus: variants.length,
    status: product.status === "ARCHIVED" ? "Archived" : "Active",
    stockStatus,
    updated: new Date(product.updatedAt).toLocaleDateString(),
    image: product.imageCover || images[0]?.imageUrl || PRODUCT_PLACEHOLDER_IMAGE,
    rating: Number(product.ratingsAverage) || 0,
    ratingCount: product.ratingsQuantity || 0,
    colorSwatches: Array.from(new Set(variants.map((variant) => variant.color).filter((color): color is string => Boolean(color)))),
  };
}
