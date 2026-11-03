/**
 * Mirrors the API's ProductVariants.getPriceAfterDiscount():
 * the variant's own discount wins; otherwise the product-wide discount applies.
 */
export function positivePercent(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const pct = Number(value);
  return Number.isFinite(pct) && pct > 0 ? Math.min(pct, 100) : undefined;
}

export function effectivePercent(variantPercent: unknown, productPercent: unknown): number | undefined {
  return positivePercent(variantPercent) ?? positivePercent(productPercent);
}

export function applyDiscount(price: number, percent: number | undefined): number {
  if (!percent || !(price > 0)) return price;
  return Math.round(price * (1 - percent / 100) * 100) / 100;
}

/** Unit price the customer pays for a variant. */
export function salePrice(
  variant: { price: number; discountPercent?: number | null },
  productPercent?: unknown,
): number {
  return applyDiscount(Number(variant.price) || 0, effectivePercent(variant.discountPercent, productPercent));
}
