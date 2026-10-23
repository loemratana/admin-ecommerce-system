import { describe, expect, it, vi } from "vitest";
import { receiveReturn } from "./returns.api";
import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ReceiveReturnPayload } from "../types/return.types";

vi.mock("@/lib/api/client", () => ({
  default: {
    patch: vi.fn(),
  },
}));

describe("returns.api receiveReturn", () => {
  it("sends a PATCH request to the receive endpoint with the exact payload", async () => {
    const mockPayload: ReceiveReturnPayload = {
      items: [
        { returnItemId: 101, condition: "RESTOCK" },
        { returnItemId: 102, condition: "DAMAGED" },
      ],
      note: "Central warehouse receiving note",
    };

    (api.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        success: true,
        message: "Return received successfully",
        data: { returnNumber: "RET-2026-0001", status: "RECEIVED" },
      },
    });

    const response = await receiveReturn("RET-2026-0001", mockPayload);

    expect(api.patch).toHaveBeenCalledWith(
      ENDPOINTS.returns.receive("RET-2026-0001"),
      mockPayload
    );
    expect(response.data.data.status).toBe("RECEIVED");
  });
});
