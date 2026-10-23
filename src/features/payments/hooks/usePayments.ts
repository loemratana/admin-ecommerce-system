import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrderPayments, getPayments } from "@/features/payments/api/payments.api";
import type { PaymentQuery } from "@/features/payments/types/payment.types";

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
  });
}

export function useOrderPayments(orderNumber: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.forOrder(orderNumber ?? ""),
    queryFn: async () => (await getOrderPayments(orderNumber as string)).data.data,
    enabled: Boolean(orderNumber),
  });
}
