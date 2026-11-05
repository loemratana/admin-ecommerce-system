import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrderPayments, getPayments } from "@/features/payments/api/payments.api";
import type { PaymentQuery, PaymentResponse } from "@/features/payments/types/payment.types";

/**
 * ABA PayWay / Stripe payments are confirmed by the API in the background (every 30s), so refresh
 * while a pending online payment is on screen. Cash on delivery waits for the courier, not a gateway.
 */
const PENDING_ONLINE_REFRESH_MS = 15_000;

const hasPendingOnline = (payments: PaymentResponse[] | undefined) =>
  payments?.some((p) => p.status === "PENDING" && p.method !== "CASH_ON_DELIVERY") ?? false;

export const paymentKeys = {
  all: ["payments"] as const,
  list: (query: PaymentQuery) => [...paymentKeys.all, "list", query] as const,
  forOrder: (orderNumber: string) => [...paymentKeys.all, "order", orderNumber] as const,
};

export function usePayments(query: PaymentQuery) {
  return useQuery({
    queryKey: paymentKeys.list(query),
    queryFn: async () => (await getPayments(query)).data.data,
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (hasPendingOnline(q.state.data?.content) ? PENDING_ONLINE_REFRESH_MS * 2 : false),
  });
}

export function useOrderPayments(orderNumber: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.forOrder(orderNumber ?? ""),
    queryFn: async () => (await getOrderPayments(orderNumber as string)).data.data,
    enabled: Boolean(orderNumber),
    refetchInterval: (q) => (hasPendingOnline(q.state.data) ? PENDING_ONLINE_REFRESH_MS : false),
  });
}
