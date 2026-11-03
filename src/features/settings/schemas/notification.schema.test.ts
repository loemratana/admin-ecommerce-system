import { describe, expect, it } from "vitest";
import { notificationDestinationSchema } from "./notification.schema";

const base = { name: "Sales team", events: ["NEW_ORDER"], enabled: true };

const targetError = (values: object) => {
  const result = notificationDestinationSchema.safeParse({ ...base, ...values });
  return result.success ? null : result.error.issues.find((issue) => issue.path[0] === "target")?.message ?? null;
};

describe("notificationDestinationSchema", () => {
  it("accepts Telegram chat ids and @channel usernames", () => {
    expect(targetError({ channel: "TELEGRAM", target: "-1001234567890" })).toBeNull();
    expect(targetError({ channel: "TELEGRAM", target: "@shop_alerts" })).toBeNull();
  });

  it("rejects invite links and other text for Telegram", () => {
    expect(targetError({ channel: "TELEGRAM", target: "https://t.me/+abc" })).toMatch(/chat id/);
    expect(targetError({ channel: "TELEGRAM", target: "sales group" })).toMatch(/chat id/);
  });

  it("validates email targets", () => {
    expect(targetError({ channel: "EMAIL", target: "team@example.com" })).toBeNull();
    expect(targetError({ channel: "EMAIL", target: "-1001234567890" })).toMatch(/email/);
  });

  it("requires at least one event", () => {
    const result = notificationDestinationSchema.safeParse({ ...base, channel: "EMAIL", target: "team@example.com", events: [] });
    expect(result.success).toBe(false);
  });
});
