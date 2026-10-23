/** color "" = general image shown for every color */
export type ProductImage = { id: string; url: string; color: string; sortOrder: number; serverId?: number };
export type ProductVariant = {
  id: string;
  color: string;
  sizeId: string;
  sku: string;
  price: number;
  priceAfterDiscount: number;
  /** Read-only: changed only by shipped orders. */
  soldQuantity: number;
  /** Read-only, from inventory (on hand - reserved). Undefined for unsaved variants. */
  availableQuantity?: number;
  /** Opening stock, sent only for new variants. */
  initialStock: number;
  serverId?: number;
};
