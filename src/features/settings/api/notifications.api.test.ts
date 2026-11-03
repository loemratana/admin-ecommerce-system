import { describe, expect, it, vi } from "vitest";
import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  createNotificationDestination,
  sendTestNotification,
  updateNotificationDestination,
} from "./notifications.api";
import type { NotificationDestinationPayload } from "../types/notification.types";

vi.mock("@/lib/api/client", () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const payload: NotificationDestinationPayload = {
  name: "Sales team",
  channel: "TELEGRAM",
  target: "-1001234567890",
  events: ["NEW_ORDER", "LOW_STOCK"],
  enabled: true,
};

describe("notifications.api", () => {
  it("creates a destination with a POST to the collection", async () => {
    await createNotificationDestination(payload);
    expect(api.post).toHaveBeenCalledWith("/api/v1/settings/notification-destinations", payload);
  });

  it("replaces a destination with a PUT to its id", async () => {
    await updateNotificationDestination(7, payload);
    expect(api.put).toHaveBeenCalledWith(ENDPOINTS.settings.notificationDestination(7), payload);
    expect(ENDPOINTS.settings.notificationDestination(7)).toBe("/api/v1/settings/notification-destinations/7");
  });

  it("sends a test message with a POST to /{id}/test", async () => {
    await sendTestNotification(7);
    expect(api.post).toHaveBeenCalledWith("/api/v1/settings/notification-destinations/7/test");
  });
});
