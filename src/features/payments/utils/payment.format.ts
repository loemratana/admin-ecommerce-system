import type { PaymentMethod, PaymentResponse, PaymentStatus } from "@/features/payments/types/payment.types";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

export const PAYMENT_METHODS: PaymentMethod[] = ["STRIPE", "CASH_ON_DELIVERY"];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  STRIPE: "Card (Stripe)",
  CASH_ON_DELIVERY: "Cash on delivery",
};

export const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "SUCCEEDED", "FAILED", "EXPIRED", "CANCELLED", "PARTIALLY_REFUNDED", "REFUNDED"];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  SUCCEEDED: "Paid",
  FAILED: "Failed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  PARTIALLY_REFUNDED: "Partly refunded",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, BadgeColor> = {
  PENDING: "warning",
  SUCCEEDED: "success",
  FAILED: "error",
  EXPIRED: "light",
  CANCELLED: "light",
  PARTIALLY_REFUNDED: "info",
  REFUNDED: "dark",
};

const CAPTURED: PaymentStatus[] = ["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"];

/** The payment that actually took the money (refunds go back through it), if any. Newest first, like the API. */
export function capturedPayment(payments: PaymentResponse[]): PaymentResponse | undefined {
  return payments.find((p) => CAPTURED.includes(p.status));
}

/**
 * How a refund reaches the customer, per method. The backend refunds automatically when a paid
 * order is cancelled or a return is received; cash has to be handed back in person.
 */
export const REFUND_ROUTE: Record<PaymentMethod, { automatic: boolean; done: string; upcoming: string }> = {
  STRIPE: {
    automatic: true,
    done: "Refunded to the customer's card through Stripe. It can take 5–10 business days to show on their statement. Don't refund it again in Stripe.",
    upcoming: "Sent back to the customer's card through Stripe automatically. Don't refund it in Stripe yourself.",
  },
  CASH_ON_DELIVERY: {
    automatic: false,
    done: "Paid in cash on delivery: the refund is recorded, but you need to hand the money back to the customer.",
    upcoming: "Paid in cash on delivery: the refund will be recorded, but you'll need to hand the money back to the customer.",
  },
};

/** What a pending payment is waiting for, per method. */
export const PAYMENT_PENDING_HINT: Record<PaymentMethod, string> = {
  STRIPE: "Waiting for the customer to pay on Stripe",
  CASH_ON_DELIVERY: "Collected by the courier on delivery",
};
