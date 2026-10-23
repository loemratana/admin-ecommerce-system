import type { ReturnItemCondition, ReturnStatus } from "@/features/returns/types/return.types";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

export const RETURN_STATUSES: ReturnStatus[] = ["REQUESTED", "APPROVED", "RECEIVED", "REJECTED", "CANCELLED"];

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export const RETURN_STATUS_COLOR: Record<ReturnStatus, BadgeColor> = {
  REQUESTED: "warning",
  APPROVED: "info",
  REJECTED: "error",
  RECEIVED: "success",
  CANCELLED: "light",
};

/** What the admin should do next, for the list's "needs attention" hint. */
export const RETURN_NEXT_STEP: Partial<Record<ReturnStatus, string>> = {
  REQUESTED: "Review request",
  APPROVED: "Waiting for items",
};

export const RETURN_ITEM_CONDITIONS: ReturnItemCondition[] = ["RESTOCK", "DAMAGED"];

export const CONDITION_LABEL: Record<ReturnItemCondition, string> = {
  RESTOCK: "Back to stock",
  DAMAGED: "Damaged – write off",
};

export const CONDITION_DESCRIPTION: Record<ReturnItemCondition, string> = {
  RESTOCK: "Item is sellable and will be returned to inventory stock.",
  DAMAGED: "Item is unsellable and will be written off without restocking.",
};
