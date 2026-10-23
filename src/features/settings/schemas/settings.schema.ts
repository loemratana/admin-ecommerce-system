import { z } from "zod";

// Limits match the @Valid constraints on the API's *SettingsRequest DTOs.

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must not exceed ${max} characters.`);

const wholeNumber = (label: string, min: number, max: number, unit: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => /^\d+$/.test(value), `${label} must be a whole number.`)
    .refine((value) => Number(value) >= min && Number(value) <= max, `${label} must be between ${min} and ${max} ${unit}.`);

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Store name is required.").max(150, "Store name must not exceed 150 characters."),
  email: z
    .string()
    .trim()
    .max(150, "Email must not exceed 150 characters.")
    .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address."),
  phone: optionalText(30, "Phone"),
  address: optionalText(255, "Address"),
  description: optionalText(1000, "Description"),
});

/** Form values are strings (what inputs give us); tax is entered as a percent and sent as a fraction. */
export const orderSettingsSchema = z.object({
  taxPercent: z
    .string()
    .trim()
    .min(1, "Tax rate is required.")
    .refine((value) => /^\d{1,3}(\.\d{1,2})?$/.test(value), "Tax rate can have at most 2 decimal places.")
    .refine((value) => Number(value) <= 100, "Tax rate cannot be more than 100%."),
  shippingFee: z
    .string()
    .trim()
    .min(1, "Shipping fee is required.")
    .refine((value) => /^\d{1,8}(\.\d{1,2})?$/.test(value), "Shipping fee must be a positive amount with at most 2 decimals."),
  pendingTimeoutMinutes: wholeNumber("Unpaid order timeout", 5, 10080, "minutes"),
  returnWindowDays: wholeNumber("Return window", 0, 365, "days"),
});

export const localizationSettingsSchema = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/, "Pick a currency."),
  timezone: z.string().min(1, "Pick a timezone."),
});

export const securitySettingsSchema = z.object({
  accessTokenTtlMinutes: wholeNumber("Token lifetime", 5, 1440, "minutes"),
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;
export type OrderSettingsFormValues = z.infer<typeof orderSettingsSchema>;
export type LocalizationSettingsFormValues = z.infer<typeof localizationSettingsSchema>;
export type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>;
