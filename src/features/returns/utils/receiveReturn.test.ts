import { describe, expect, it } from "vitest";
import { validateAndBuildReceivePayload } from "./receiveReturn";
import type { ReturnItemResponse } from "@/features/returns/types/return.types";

describe("validateAndBuildReceivePayload", () => {
  const mockItems: ReturnItemResponse[] = [
    {
      id: 10, // Actual return item database ID
      orderItemId: 999, // Order item ID (MUST NOT be used as returnItemId)
      productVariantId: 42,
      productName: "Classic Oxford Cotton Shirt",
      sku: "OXF-BLU-M",
      color: "Blue",
      sizeName: "M",
      imageUrl: "https://example.com/shirt.jpg",
      quantity: 2,
      unitPrice: 49.99,
      condition: null,
    },
    {
      id: 15, // Actual return item database ID
      orderItemId: 888,
      productVariantId: 43,
      productName: "Slim Chino Pants",
      sku: "CHN-KHK-32",
      color: "Khaki",
      sizeName: "32",
      imageUrl: null,
      quantity: 1,
      unitPrice: 59.99,
      condition: null,
    },
  ];

  it("builds the exact backend ReceiveReturnRequest payload when all items have valid conditions", () => {
    const conditions = {
      10: "RESTOCK" as const,
      15: "DAMAGED" as const,
    };

    const result = validateAndBuildReceivePayload(mockItems, conditions, " Central warehouse inspection note. ");

    expect(result.isValid).toBe(true);
    expect(result.itemErrors).toEqual({});
    expect(result.generalError).toBeUndefined();

    // Verify exact payload shape
    expect(result.payload).toEqual({
      items: [
        { returnItemId: 10, condition: "RESTOCK" },
        { returnItemId: 15, condition: "DAMAGED" },
      ],
      note: "Central warehouse inspection note.",
    });

    // Ensure returnItemId is item.id, NOT orderItemId
    expect(result.payload?.items[0].returnItemId).toBe(10);
    expect(result.payload?.items[0].returnItemId).not.toBe(999);
    expect(result.payload?.items[1].returnItemId).toBe(15);
    expect(result.payload?.items[1].returnItemId).not.toBe(888);

    // Ensure unsupported fields (receivedQuantity, inspectionNote) are NOT present
    const firstItem = result.payload?.items[0] as unknown as Record<string, unknown>;
    expect(firstItem.receivedQuantity).toBeUndefined();
    expect(firstItem.quantity).toBeUndefined();
    expect(firstItem.inspectionNote).toBeUndefined();
    expect(firstItem.orderItemId).toBeUndefined();
  });

  it("omits note from payload when note is not provided or is blank", () => {
    const conditions = {
      10: "RESTOCK" as const,
      15: "RESTOCK" as const,
    };

    const resultWithoutNote = validateAndBuildReceivePayload(mockItems, conditions);
    expect(resultWithoutNote.isValid).toBe(true);
    expect(resultWithoutNote.payload?.items).toHaveLength(2);
    expect(resultWithoutNote.payload).not.toHaveProperty("note");

    const resultWithBlankNote = validateAndBuildReceivePayload(mockItems, conditions, "    ");
    expect(resultWithBlankNote.isValid).toBe(true);
    expect(resultWithBlankNote.payload).not.toHaveProperty("note");
  });

  it("fails validation when any item has an unselected condition", () => {
    const conditions = {
      10: "RESTOCK" as const,
      15: "" as const, // Unselected
    };

    const result = validateAndBuildReceivePayload(mockItems, conditions);

    expect(result.isValid).toBe(false);
    expect(result.payload).toBeUndefined();
    expect(result.itemErrors[15]).toBeDefined();
    expect(result.itemErrors[15]).toContain("Please select an inspection condition");
    expect(result.generalError).toContain("Please select an inspection condition for all 1 item(s)");
  });

  it("fails validation when condition is missing completely from conditions map", () => {
    const conditions = {
      10: "RESTOCK" as const,
    };

    const result = validateAndBuildReceivePayload(mockItems, conditions);

    expect(result.isValid).toBe(false);
    expect(result.payload).toBeUndefined();
    expect(result.itemErrors[15]).toBeDefined();
  });

  it("fails validation when an invalid condition string is supplied", () => {
    const conditions = {
      10: "RESTOCK" as const,
      15: "INVALID_CONDITION" as any,
    };

    const result = validateAndBuildReceivePayload(mockItems, conditions);

    expect(result.isValid).toBe(false);
    expect(result.payload).toBeUndefined();
    expect(result.itemErrors[15]).toBeDefined();
  });

  it("fails validation when items list is empty or undefined", () => {
    const resultEmpty = validateAndBuildReceivePayload([], {});
    expect(resultEmpty.isValid).toBe(false);
    expect(resultEmpty.generalError).toContain("No return items available");

    const resultNull = validateAndBuildReceivePayload(null, {});
    expect(resultNull.isValid).toBe(false);
    expect(resultNull.generalError).toContain("No return items available");
  });

  it("fails validation when an item does not have a valid positive return item ID", () => {
    const invalidItems: ReturnItemResponse[] = [
      {
        ...mockItems[0],
        id: 0, // Invalid ID
      },
    ];

    const conditions = {
      0: "RESTOCK" as const,
    };

    const result = validateAndBuildReceivePayload(invalidItems, conditions);
    expect(result.isValid).toBe(false);
    expect(result.itemErrors[0]).toContain("Invalid return item ID");
  });

  it("fails validation when receiving note exceeds 1000 characters", () => {
    const conditions = {
      10: "RESTOCK" as const,
      15: "DAMAGED" as const,
    };

    const longNote = "a".repeat(1001);
    const result = validateAndBuildReceivePayload(mockItems, conditions, longNote);

    expect(result.isValid).toBe(false);
    expect(result.noteError).toBe("Warehouse note cannot exceed 1000 characters.");
  });

  it("accepts receiving note with exactly 1000 characters", () => {
    const conditions = {
      10: "RESTOCK" as const,
      15: "DAMAGED" as const,
    };

    const exactNote = "a".repeat(1000);
    const result = validateAndBuildReceivePayload(mockItems, conditions, exactNote);

    expect(result.isValid).toBe(true);
    expect(result.payload?.note).toBe(exactNote);
  });
});
