// Mirrors NotificationDestinationRequest/Response in the API's notification package.

export type NotificationChannel = "TELEGRAM" | "EMAIL";

export type NotificationEvent = "NEW_ORDER" | "LOW_STOCK" | "NEW_PRODUCT";

export type NotificationDestination = {
  id: number;
  name: string;
  channel: NotificationChannel;
  /** Telegram chat id (e.g. -1001234567890) or @channelusername; or an email address. */
  target: string;
  events: NotificationEvent[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationDestinationPayload = {
  name: string;
  channel: NotificationChannel;
  target: string;
  events: NotificationEvent[];
  enabled: boolean;
};

/** GET .../channels: whether the server has each channel's credentials (never the credentials themselves). */
export type NotificationChannelStatus = Record<NotificationChannel, boolean>;
