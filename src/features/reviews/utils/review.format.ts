import type { ReviewProductSummary } from "@/features/reviews/types/review.types";

/**
 * Display name for a reviewed product. The API leaves `name` empty, so fall back to the
 * slug ("classic-white-tee" -> "Classic White Tee"), then to the id.
 */
export function reviewProductName(product: ReviewProductSummary): string {
  if (product.name?.trim()) return product.name;
  if (product.slug?.trim()) {
    return product.slug
      .split(/[-_]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }
  return `Product #${product.id}`;
}
