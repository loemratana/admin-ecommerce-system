// Mirrors the Spring DTOs in ecommerce-api/returns/dto.
export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "RECEIVED" | "CANCELLED";
export type ReturnItemCondition = "RESTOCK" | "DAMAGED";

export interface ReturnItemResponse {
  id: number;
  orderItemId: number;
  productVariantId: number | null;
  productName: string;
  sku: string | null;
  color: string | null;
  sizeName: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  /** null until the items are received */
  condition: ReturnItemCondition | null;
}

export interface ReturnResponse {
  returnNumber: string;
  status: ReturnStatus;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  reason: string;
  adminNote: string | null;
  /** What the customer gets back if everything is received (coupons/tax shared out, no shipping). */
  estimatedRefund: number;
  /** Set once RECEIVED. */
  refundAmount: number | null;
  items: ReturnItemResponse[];
  createdAt: string;
  updatedAt: string;
  receivedAt: string | null;
}

export interface ReturnQuery {
  status?: ReturnStatus;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ReceiveReturnItemPayload {
  returnItemId: number;
  condition: ReturnItemCondition;
}

export interface ReceiveReturnPayload {
  items: ReceiveReturnItemPayload[];
  note?: string;
}

export interface RejectReturnPayload {
  note: string;
}

export interface ApproveReturnPayload {
  note?: string;
}
