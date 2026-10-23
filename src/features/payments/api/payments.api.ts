import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PageResponse } from "@/lib/api/types";
import type { PaymentQuery, PaymentResponse } from "@/features/payments/types/payment.types";

// Admin only. Newest first by default.
export function getPayments(query: PaymentQuery = {}) {
  return api.get<ApiResponse<PageResponse<PaymentResponse>>>(ENDPOINTS.payments.base, { params: query });
}

// Every attempt for one order (a customer can retry or switch method), newest first.
export function getOrderPayments(orderNumber: string) {
  return api.get<ApiResponse<PaymentResponse[]>>(ENDPOINTS.payments.forOrder(orderNumber));
}
