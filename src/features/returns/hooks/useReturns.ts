import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveReturn,
  getOrderReturns,
  getReturn,
  getReturns,
  getReturnStats,
  receiveReturn,
  rejectReturn,
} from "@/features/returns/api/returns.api";
import type { ReceiveReturnPayload, ReturnQuery, ReturnResponse } from "@/features/returns/types/return.types";
import { orderKeys } from "@/features/orders/hooks/useOrders";
import { inventoryKeys } from "@/features/inventory/hooks/useInventory";
import { dashboardKeys } from "@/features/dashboard/hooks/useDashboard";
import { paymentKeys } from "@/features/payments/hooks/usePayments";

export const returnKeys = {
  all: ["returns"] as const,
  list: (query: ReturnQuery) => [...returnKeys.all, "list", query] as const,
  stats: () => [...returnKeys.all, "stats"] as const,
  detail: (returnNumber: string) => [...returnKeys.all, "detail", returnNumber] as const,
  forOrder: (orderNumber: string) => [...returnKeys.all, "order", orderNumber] as const,
};

export function useReturns(query: ReturnQuery) {
  return useQuery({
    queryKey: returnKeys.list(query),
    queryFn: async () => (await getReturns(query)).data.data,
    placeholderData: keepPreviousData,
  });
}

export function useReturnStats() {
  return useQuery({
    queryKey: returnKeys.stats(),
    queryFn: async () => (await getReturnStats()).data.data,
  });
}

export function useReturn(returnNumber: string | undefined) {
  return useQuery({
    queryKey: returnKeys.detail(returnNumber ?? ""),
    queryFn: async () => (await getReturn(returnNumber as string)).data.data,
    enabled: Boolean(returnNumber),
  });
}

export function useOrderReturns(orderNumber: string | undefined) {
  return useQuery({
    queryKey: returnKeys.forOrder(orderNumber ?? ""),
    queryFn: async () => (await getOrderReturns(orderNumber as string)).data.data,
    enabled: Boolean(orderNumber),
  });
}

type Action =
  | { type: "approve"; returnNumber: string; note?: string }
  | { type: "reject"; returnNumber: string; note: string }
  | { type: "receive"; returnNumber: string; payload: ReceiveReturnPayload };

export function useReturnAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: Action) => {
      switch (action.type) {
        case "approve":
          return approveReturn(action.returnNumber, action.note);
        case "reject":
          return rejectReturn(action.returnNumber, action.note);
        case "receive":
          return receiveReturn(action.returnNumber, action.payload);
      }
    },
    onSuccess: (response) => {
      const updated: ReturnResponse = response.data.data;
      queryClient.setQueryData(returnKeys.detail(updated.returnNumber), updated);
      queryClient.invalidateQueries({ queryKey: returnKeys.all });
      // Receiving restocks items, records a refund on the order (revenue drops) and refunds the payment.
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
