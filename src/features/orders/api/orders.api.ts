import api from "@/lib/api/client";
import { downloadFile } from "@/lib/api/download";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PageResponse } from "@/lib/api/types";
import type { OrderQuery, OrderResponse, OrderStatsResponse, OrderStatus, OrderSummaryResponse } from "@/features/orders/types/order.types";

// All of these are admin only.

// GET /api/v1/orders, newest first by default.
export function getOrders(query: OrderQuery = {}) {
  return api.get<ApiResponse<PageResponse<OrderSummaryResponse>>>(ENDPOINTS.orders.base, { params: query });
}

export function getOrderStats() {
  return api.get<ApiResponse<OrderStatsResponse>>(ENDPOINTS.orders.stats);
}

export function getOrder(orderNumber: string) {
  return api.get<ApiResponse<OrderResponse>>(ENDPOINTS.orders.byNumber(orderNumber));
}

// The backend rejects illegal transitions with 409 (see ORDER_NEXT_STATUSES).
export function updateOrderStatus(orderNumber: string, status: OrderStatus) {
  return api.patch<ApiResponse<OrderResponse>>(ENDPOINTS.orders.status(orderNumber), { status });
}

// PDF invoice; the backend answers 409 for orders that are not paid yet (see REVENUE_STATUSES).
export function downloadOrderInvoice(orderNumber: string) {
  return downloadFile(ENDPOINTS.orders.invoice(orderNumber), `invoice-${orderNumber}.pdf`);
}

// .xlsx with an Orders and an Items sheet. from/to are yyyy-MM-dd, both inclusive, at most 366 days apart.
export function exportOrdersExcel(params: { from: string; to: string; status?: OrderStatus }) {
  return downloadFile(ENDPOINTS.exports.orders, `orders_${params.from}_${params.to}.xlsx`, params);
}
