import type {
  ReceiveReturnPayload,
  ReturnItemCondition,
  ReturnItemResponse,
} from "@/features/returns/types/return.types";

export interface ReceiveReturnValidationResult {
  isValid: boolean;
  itemErrors: Record<number, string>;
  noteError?: string;
  generalError?: string;
  payload?: ReceiveReturnPayload;
}

/**
 * Validates condition selection and builds the backend ReceiveReturnRequest payload.
 *
 * Backend Contract:
 * - items: non-empty list
 * - items[].returnItemId: Long (item.id)
 * - items[].condition: "RESTOCK" | "DAMAGED"
 * - note?: string, max 1000 characters
 *
 * receivedQuantity and inspectionNote are NOT accepted by the backend.
 */
export function validateAndBuildReceivePayload(
  items: ReturnItemResponse[] | undefined | null,
  conditions: Record<number, ReturnItemCondition | "" | undefined | null>,
  note?: string
): ReceiveReturnValidationResult {
  const itemErrors: Record<number, string> = {};
  let isValid = true;

  if (!items || items.length === 0) {
    return {
      isValid: false,
      itemErrors: {},
      generalError: "No return items available to receive.",
    };
  }

  const payloadItems: { returnItemId: number; condition: ReturnItemCondition }[] = [];

  for (const item of items) {
    // Validate returnItemId
    if (typeof item.id !== "number" || !Number.isFinite(item.id) || item.id <= 0) {
      itemErrors[item.id ?? 0] = `Invalid return item ID for "${item.productName}".`;
      isValid = false;
      continue;
    }

    const cond = conditions[item.id];
    if (!cond || (cond !== "RESTOCK" && cond !== "DAMAGED")) {
      itemErrors[item.id] = `Please select an inspection condition for "${item.productName}".`;
      isValid = false;
      continue;
    }

    payloadItems.push({
      returnItemId: item.id,
      condition: cond,
    });
  }

  let noteError: string | undefined;
  const trimmedNote = note ? note.trim() : "";
  if (trimmedNote.length > 1000) {
    noteError = "Warehouse note cannot exceed 1000 characters.";
    isValid = false;
  }

  if (!isValid) {
    const missingCount = Object.keys(itemErrors).length;
    return {
      isValid: false,
      itemErrors,
      noteError,
      generalError:
        missingCount > 0
          ? `Please select an inspection condition for all ${missingCount} item(s) before confirming receipt.`
          : noteError,
    };
  }

  return {
    isValid: true,
    itemErrors: {},
    payload: {
      items: payloadItems,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    },
  };
}
