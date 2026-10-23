import type { OrderStatus } from "@/features/orders/types/order.types";
import type { PaymentMethod } from "@/features/payments/types/payment.types";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, BadgeColor> = {
  PENDING: "warning",
  PAID: "info",
  PROCESSING: "primary",
  SHIPPED: "light",
  DELIVERED: "success",
  CANCELLED: "error",
};

// Orders that have actually brought money in (pending = unpaid, cancelled = refunded/never paid).
export const REVENUE_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

// The happy path, in order. CANCELLED sits outside it.
export const ORDER_FLOW: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

// Mirrors OrderStatus.canTransitionTo on the backend.
export const ORDER_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

// Button label for moving an order forward to the given status.
export const ORDER_ACTION_LABEL: Record<OrderStatus, string> = {
  PENDING: "Mark as pending",
  PAID: "Mark as paid",
  PROCESSING: "Start processing",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered",
  CANCELLED: "Cancel order",
};

// Cash on delivery is paid at the door, so a pending COD order skips PAID (Order.startProcessing on the backend).
const COD_FLOW: OrderStatus[] = ORDER_FLOW.filter((step) => step !== "PAID");

/** The happy path for this order: without PAID for cash on delivery. */
export function orderFlow(paymentMethod?: PaymentMethod | null): OrderStatus[] {
  return paymentMethod === "CASH_ON_DELIVERY" ? COD_FLOW : ORDER_FLOW;
}

/** Statuses this order can move to next; use this rather than ORDER_NEXT_STATUSES when the payment method is known. */
export function orderNextStatuses(status: OrderStatus, paymentMethod?: PaymentMethod | null): OrderStatus[] {
  if (status === "PENDING" && paymentMethod === "CASH_ON_DELIVERY") return ["PROCESSING", "CANCELLED"];
  return ORDER_NEXT_STATUSES[status];
}

export function nextForwardStatus(status: OrderStatus, paymentMethod?: PaymentMethod | null): OrderStatus | undefined {
  return orderNextStatuses(status, paymentMethod).find((next) => next !== "CANCELLED");
}

export function formatOrderDate(value: string, withTime = true) {
  return new Date(value).toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

// Money uses the store currency from Settings / Localization; kept here for existing imports.
export { formatCompactMoney, formatMoney } from "@/lib/currency";
