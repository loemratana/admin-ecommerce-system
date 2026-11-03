import type { Product } from "@/features/products/types/product-list.types";
import { PRODUCT_TYPE_OPTIONS, type ProductResponse } from "@/features/products/types/product.types";
import { effectivePercent, positivePercent } from "@/features/products/utils/pricing";

// Same threshold the API uses for its low-stock stats.
const LOW_STOCK_THRESHOLD = 10;

export function toUiProduct(product: ProductResponse): Product {
  const variants = product.variants ?? [];
  const images = product.images ?? [];
  const prices = variants.map((variant) => Number(variant.priceAfterDiscount || variant.price)).filter((price) => price > 0);
  const cheapest = prices.length ? Math.min(...prices) : 0;
  const listPrice = variants.find((variant) => Number(variant.priceAfterDiscount || variant.price) === cheapest);
  const originalPrice = listPrice?.priceAfterDiscount && listPrice.priceAfterDiscount < listPrice.price ? listPrice.price : undefined;
  // effectiveDiscountPercent includes the product-wide discount; older responses only had discountPercent.
  const appliedPercent = (v: (typeof variants)[number]) =>
    positivePercent(v.effectiveDiscountPercent) ?? effectivePercent(v.discountPercent, product.discountPercent);
  const variantDiscounts = variants
    .map((v) => {
      const pct = appliedPercent(v);
      if (pct) {
        return pct;
      }
      if (v.priceAfterDiscount !== null && v.priceAfterDiscount !== undefined && Number(v.priceAfterDiscount) < Number(v.price)) {
        return Math.round((1 - Number(v.priceAfterDiscount) / Number(v.price)) * 100);
      }
      return 0;
    });

  const maxDiscount = variantDiscounts.length ? Math.max(...variantDiscounts) : 0;
  const minDiscount = variantDiscounts.length ? Math.min(...variantDiscounts) : 0;
  const hasMixedDiscounts = maxDiscount > 0 && minDiscount !== maxDiscount;

  const rawDiscount =
    (listPrice ? appliedPercent(listPrice) : undefined) ??
    (originalPrice && listPrice?.priceAfterDiscount
      ? Math.round((1 - listPrice.priceAfterDiscount / originalPrice) * 100)
      : (maxDiscount > 0 ? maxDiscount : undefined));
  const discountPercent = rawDiscount && rawDiscount > 0 ? rawDiscount : undefined;
  const stockTotal = variants.reduce((total, variant) => total + (variant.availableQuantity || 0), 0);
  const stockStatus: Product["stockStatus"] = stockTotal <= 0 ? "Out of Stock" : stockTotal <= LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock";
  const colors = new Set(variants.map((variant) => variant.color).filter(Boolean)).size;
  const sizes = new Set(variants.map((variant) => variant.size?.name).filter(Boolean)).size;

  return {
    id: String(product.id),
    name: product.title,
    sku: listPrice?.sku || variants[0]?.sku || "—",
    category: product.subCategory?.subCategoryName || "—",
    brand: product.brand?.brandName || "—",
    type: PRODUCT_TYPE_OPTIONS.find((option) => option.value === product.productType)?.label || "—",
    variants: variants.length,
    colors,
    sizes,
    price: cheapest,
    originalPrice,
    discountPercent,
    hasMixedDiscounts,
    stock: stockTotal,
    skus: variants.length,
    status: product.status === "ARCHIVED" ? "Archived" : "Active",
    stockStatus,
    updated: new Date(product.updatedAt).toLocaleDateString(),
    image: product.imageCover || images[0]?.imageUrl || null,
    rating: Number(product.ratingsAverage) || 0,
    ratingCount: product.ratingsQuantity || 0,
    colorSwatches: Array.from(new Set(variants.map((variant) => variant.color).filter((color): color is string => Boolean(color)))),
  };
}
