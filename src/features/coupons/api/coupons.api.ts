import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { Coupon, CouponPayload } from "@/features/coupons/types/coupon.types";

export function getCoupons() {
  return api.get<ApiResponse<Coupon[]>>(ENDPOINTS.coupons.base);
}

export function getCoupon(id: number) {
  return api.get<ApiResponse<Coupon>>(ENDPOINTS.coupons.byId(id));
}

export function createCoupon(payload: CouponPayload) {
  return api.post<ApiResponse<Coupon>>(ENDPOINTS.coupons.base, payload);
}

export function updateCoupon(id: number, payload: CouponPayload) {
  return api.put<ApiResponse<Coupon>>(ENDPOINTS.coupons.byId(id), payload);
}

export function deleteCoupon(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.coupons.byId(id));
}

export function activateCoupon(id: number) {
  return api.patch<ApiResponse<Coupon>>(ENDPOINTS.coupons.activate(id));
}

export function deactivateCoupon(id: number) {
  return api.patch<ApiResponse<Coupon>>(ENDPOINTS.coupons.deactivate(id));
}
