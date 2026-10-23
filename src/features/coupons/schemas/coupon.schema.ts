import { z } from "zod";

const money = /^\d{1,8}(\.\d{1,2})?$/;

/** Form values are kept as strings (what inputs give us) and converted to the API payload on submit. */
export const couponSchema = z
  .object({
    code: z.string().trim().min(1, "Coupon code is required.").max(50, "Coupon code must not exceed 50 characters."),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z
      .string()
      .trim()
      .min(1, "Discount is required.")
      .refine((value) => money.test(value), "Discount can have at most 2 decimal places.")
      .refine((value) => Number(value) >= 0.01, "Discount must be greater than 0."),
    minOrderAmount: z
      .string()
      .trim()
      .refine((value) => value === "" || money.test(value), "Minimum order must be a positive amount with at most 2 decimals."),
    expiryDate: z
      .string()
      .min(1, "Expiry date is required.")
      .refine((value) => new Date(`${value}T23:59:59`) > new Date(), "Expiry date must be in the future."),
    usageLimit: z
      .string()
      .trim()
      .refine((value) => value === "" || (Number.isInteger(Number(value)) && Number(value) > 0), "Usage limit must be a whole number greater than 0."),
    active: z.boolean(),
  })
  .refine((values) => values.discountType !== "PERCENTAGE" || Number(values.discountValue) <= 100, {
    message: "Percentage discount cannot exceed 100%.",
    path: ["discountValue"],
  });

export type CouponFormValues = z.infer<typeof couponSchema>;
