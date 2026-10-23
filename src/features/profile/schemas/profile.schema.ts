import { z } from "zod";

export const changePasswordSchema = z
  .object({
    oldPassword: z.string(),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmNewPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "New password and confirmation do not match.",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
