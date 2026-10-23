import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PageResponse } from "@/lib/api/types";
import type { CustomerDetailResponse, CustomerQuery, CustomerStatsResponse, CustomerSummaryResponse } from "@/features/customers/types/customer.types";
import type { OrderSummaryResponse } from "@/features/orders/types/order.types";
import type { ProductReview } from "@/features/reviews/types/review.types";

// All of these are admin only.

export function getCustomers(query: CustomerQuery = {}) {
  return api.get<ApiResponse<PageResponse<CustomerSummaryResponse>>>(ENDPOINTS.customers.base, { params: query });
}

export function getCustomerStats() {
  return api.get<ApiResponse<CustomerStatsResponse>>(ENDPOINTS.customers.stats);
}

export function getCustomer(id: number) {
  return api.get<ApiResponse<CustomerDetailResponse>>(ENDPOINTS.customers.byId(id));
}

export function getCustomerOrders(id: number, page = 0, size = 10) {
  return api.get<ApiResponse<PageResponse<OrderSummaryResponse>>>(ENDPOINTS.customers.orders(id), { params: { page, size } });
}

export function getCustomerReviews(id: number, page = 0, size = 10) {
  return api.get<ApiResponse<PageResponse<ProductReview>>>(ENDPOINTS.customers.reviews(id), { params: { page, size } });
}

// A deactivated customer can no longer log in.
export function setCustomerActive(id: number, active: boolean) {
  const url = active ? ENDPOINTS.customers.activate(id) : ENDPOINTS.customers.deactivate(id);
  return api.patch<ApiResponse<CustomerDetailResponse>>(url);
}
