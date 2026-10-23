import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PageResponse } from "@/lib/api/types";
import type { ReceiveReturnPayload, ReturnQuery, ReturnResponse, ReturnStatus } from "@/features/returns/types/return.types";

// All of these are admin only.

export function getReturns(query: ReturnQuery = {}) {
  return api.get<ApiResponse<PageResponse<ReturnResponse>>>(ENDPOINTS.returns.base, { params: query });
}

export function getReturnStats() {
  return api.get<ApiResponse<Record<ReturnStatus, number>>>(ENDPOINTS.returns.stats);
}

export function getReturn(returnNumber: string) {
  return api.get<ApiResponse<ReturnResponse>>(ENDPOINTS.returns.byNumber(returnNumber));
}

export function getOrderReturns(orderNumber: string) {
  return api.get<ApiResponse<ReturnResponse[]>>(ENDPOINTS.returns.byOrder(orderNumber));
}

export function approveReturn(returnNumber: string, note?: string) {
  return api.patch<ApiResponse<ReturnResponse>>(ENDPOINTS.returns.approve(returnNumber), { note });
}

// The backend requires a note: it is shown to the customer.
export function rejectReturn(returnNumber: string, note: string) {
  return api.patch<ApiResponse<ReturnResponse>>(ENDPOINTS.returns.reject(returnNumber), { note });
}

export function receiveReturn(returnNumber: string, payload: ReceiveReturnPayload) {
  return api.patch<ApiResponse<ReturnResponse>>(ENDPOINTS.returns.receive(returnNumber), payload);
}
