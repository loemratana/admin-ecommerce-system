export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  /** Percent for PERCENTAGE, money amount for FIXED */
  discountValue: number;
  /** null = no minimum */
  minOrderAmount: number | null;
  /** ISO local date-time from the API, e.g. "2026-12-31T23:59:59" */
  expiryDate: string;
  active: boolean;
  /** Listed for shoppers in the storefront; false = only people who know the code can use it */
  showInStorefront: boolean;
  /** null = unlimited */
  usageLimit: number | null;
  usedCount: number;
  remainingUses: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponPayload {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  expiryDate: string;
  active: boolean;
  showInStorefront: boolean;
  usageLimit: number | null;
}

export type CouponStatus = "Active" | "Inactive" | "Expired" | "Used up";
