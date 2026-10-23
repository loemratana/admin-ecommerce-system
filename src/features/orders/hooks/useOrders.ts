import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { downloadOrderInvoice, exportOrdersExcel, getOrder, getOrders, getOrderStats, updateOrderStatus } from "@/features/orders/api/orders.api";
import type { OrderQuery, OrderStatus } from "@/features/orders/types/order.types";
import { dashboardKeys } from "@/features/dashboard/hooks/useDashboard";
import { inventoryKeys } from "@/features/inventory/hooks/useInventory";
import { paymentKeys } from "@/features/payments/hooks/usePayments";

export const orderKeys = {
  all: ["orders"] as const,
  list: (query: OrderQuery) => [...orderKeys.all, "list", query] as const,
  stats: () => [...orderKeys.all, "stats"] as const,
  detail: (orderNumber: string) => [...orderKeys.all, "detail", orderNumber] as const,
};

export function useOrders(query: OrderQuery) {
  return useQuery({
    queryKey: orderKeys.list(query),
    queryFn: async () => (await getOrders(query)).data.data,
    placeholderData: keepPreviousData,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: async () => (await getOrderStats()).data.data,
  });
}

export function useOrder(orderNumber: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(orderNumber ?? ""),
    queryFn: async () => (await getOrder(orderNumber as string)).data.data,
    enabled: Boolean(orderNumber),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderNumber, status }: { orderNumber: string; status: OrderStatus }) => updateOrderStatus(orderNumber, status),
    onSuccess: (response) => {
      const order = response.data.data;
      queryClient.setQueryData(orderKeys.detail(order.orderNumber), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      // Shipping confirms the sale and cancelling releases reserved stock.
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      // Delivering collects cash-on-delivery payments; cancelling cancels open attempts.
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

export function useDownloadInvoice() {
  return useMutation({ mutationFn: (orderNumber: string) => downloadOrderInvoice(orderNumber) });
}

export function useExportOrders() {
  return useMutation({ mutationFn: exportOrdersExcel });
}
