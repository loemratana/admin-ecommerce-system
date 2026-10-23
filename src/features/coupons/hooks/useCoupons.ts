import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateCoupon,
  createCoupon,
  deactivateCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from "@/features/coupons/api/coupons.api";
import type { Coupon, CouponPayload } from "@/features/coupons/types/coupon.types";

export const couponKeys = {
  all: ["coupons"] as const,
  list: () => [...couponKeys.all, "list"] as const,
};

export function useCoupons() {
  return useQuery({
    queryKey: couponKeys.list(),
    queryFn: async () => {
      const payload = (await getCoupons()).data.data;
      return Array.isArray(payload) ? payload : [];
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CouponPayload) => createCoupon(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.all }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CouponPayload }) => updateCoupon(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.all }),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.all }),
  });
}

export function useToggleCouponStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (coupon: Coupon) => (coupon.active ? deactivateCoupon(coupon.id) : activateCoupon(coupon.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.all }),
  });
}
