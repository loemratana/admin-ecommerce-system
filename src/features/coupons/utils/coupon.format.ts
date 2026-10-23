import type { Coupon, CouponStatus } from "@/features/coupons/types/coupon.types";
import { formatMoney } from "@/lib/currency";

// Store currency from Settings / Localization; re-exported for existing imports.
export { formatMoney };

export function getCouponStatus(coupon: Coupon): CouponStatus {
  if (new Date(coupon.expiryDate) <= new Date()) return "Expired";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "Used up";
  return coupon.active ? "Active" : "Inactive";
}

export const statusClass: Record<CouponStatus, string> = {
  Active: "bg-green-600 text-white",
  Inactive: "bg-slate-500 text-white",
  Expired: "bg-red-600 text-white",
  "Used up": "bg-amber-500 text-white",
};

export function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDiscount(coupon: Coupon) {
  return coupon.discountType === "FIXED" ? formatMoney(coupon.discountValue) : `${coupon.discountValue}%`;
}

export function formatMinimum(coupon: Coupon) {
  return coupon.minOrderAmount == null ? "None" : formatMoney(coupon.minOrderAmount);
}

export function formatUsage(coupon: Coupon) {
  return `${coupon.usedCount} / ${coupon.usageLimit ?? "unlimited"}`;
}
