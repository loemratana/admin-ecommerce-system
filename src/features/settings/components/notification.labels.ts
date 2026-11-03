import type { NotificationChannel, NotificationEvent } from "@/features/settings/types/notification.types";

export const EVENT_INFO: Record<NotificationEvent, { label: string; description: string }> = {
  NEW_ORDER: { label: "New order", description: "A customer placed an order (before payment)." },
  LOW_STOCK: { label: "Low stock", description: "A variant dropped to the low-stock threshold, or ran out." },
  NEW_PRODUCT: { label: "New product", description: "A product was created in the dashboard." },
};

export const CHANNEL_INFO: Record<NotificationChannel, { label: string; setup: string }> = {
  TELEGRAM: { label: "Telegram", setup: "Set TELEGRAM_BOT_TOKEN on the server." },
  EMAIL: { label: "Email", setup: "Set SMTP_HOST, SMTP_USER, SMTP_PASS and EMAIL_FROM on the server." },
};
