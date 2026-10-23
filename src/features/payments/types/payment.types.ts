// Mirrors the Spring DTOs in ecommerce-api/payment/dto.
export type PaymentMethod = "STRIPE" | "CASH_ON_DELIVERY";

/** PENDING -> SUCCEEDED -> PARTIALLY_REFUNDED -> REFUNDED; a pending payment can also end FAILED, EXPIRED or CANCELLED. */
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "REFUNDED";

export interface PaymentResponse {
  id: number;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  refundedAmount: number;
  currency: string;
  /** Where the customer pays online; null for cash on delivery. */
  redirectUrl: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentQuery {
  status?: PaymentStatus;
  method?: PaymentMethod;
  page?: number;
  size?: number;
  sort?: string;
}
