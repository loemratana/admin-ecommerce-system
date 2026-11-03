import { z } from "zod";

// Same rules as NotificationDestinationServiceImpl.normalizeTarget and the request DTO in the API.

// Group/supergroup ids are negative (supergroups start with -100); public channels can use @username.
export const TELEGRAM_CHAT_ID = /^-?\d{1,20}$/;
export const TELEGRAM_USERNAME = /^@[A-Za-z][A-Za-z0-9_]{4,31}$/;

export const NOTIFICATION_EVENTS = ["NEW_ORDER", "LOW_STOCK", "NEW_PRODUCT"] as const;

export const notificationDestinationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(100, "Name must not exceed 100 characters."),
    channel: z.enum(["TELEGRAM", "EMAIL"]),
    target: z.string().trim().min(1, "Target is required.").max(255, "Target must not exceed 255 characters."),
    events: z.array(z.enum(NOTIFICATION_EVENTS)).min(1, "Choose at least one event."),
    enabled: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.channel === "TELEGRAM" && !TELEGRAM_CHAT_ID.test(values.target) && !TELEGRAM_USERNAME.test(values.target)) {
      ctx.addIssue({ code: "custom", path: ["target"], message: "Enter a chat id such as -1001234567890, or a @channelusername." });
    }
    if (values.channel === "EMAIL" && !z.email().safeParse(values.target).success) {
      ctx.addIssue({ code: "custom", path: ["target"], message: "Enter a valid email address." });
    }
  });

export type NotificationDestinationFormValues = z.infer<typeof notificationDestinationSchema>;
