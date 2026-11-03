// Mirrors SettingsResponse and the *SettingsRequest DTOs in the API's settings package.

export type StoreSettings = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
};

export type OrderSettings = {
  /** Fraction, not percent: 0.1 = 10%. */
  taxRate: number;
  shippingFee: number;
  pendingTimeoutMinutes: number;
  returnWindowDays: number;
};

export type InventorySettings = {
  /** Available stock at or below this is "low": status badge, stats and the low-stock notification. */
  lowStockThreshold: number;
};

export type NotificationsSettings = {
  /** Email customers an order confirmation when they place an order (needs SMTP on the server). */
  customerOrderEmail: boolean;
};

export type LocalizationSettings = {
  /** ISO 4217 code; a label only, amounts are never converted. */
  currency: string;
  /** IANA zone id, e.g. Asia/Phnom_Penh. */
  timezone: string;
};

export type SecuritySettings = {
  accessTokenTtlMinutes: number;
};

export type Settings = {
  store: StoreSettings;
  orders: OrderSettings;
  inventory: InventorySettings;
  notifications: NotificationsSettings;
  localization: LocalizationSettings;
  security: SecuritySettings;
  updatedAt: string;
  updatedBy: string | null;
};

/** GET /api/v1/settings/public */
export type PublicSettings = {
  storeName: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  currency: string;
};

export type SettingsSection = "store" | "orders" | "inventory" | "notifications" | "localization" | "security";

export type SettingsPayload = {
  store: StoreSettings;
  orders: OrderSettings;
  inventory: InventorySettings;
  notifications: NotificationsSettings;
  localization: LocalizationSettings;
  security: SecuritySettings;
};
