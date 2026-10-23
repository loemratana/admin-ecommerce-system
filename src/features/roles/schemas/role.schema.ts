import { z } from "zod";

export const roleSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(1, "Role name is required.")
    .max(50, "Role name must be 50 characters or less."),
  active: z.boolean().default(true),
  description: z
    .string()
    .trim()
    .max(255, "Description must be 255 characters or less.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

/** Shape of the role dialogs */
export type RoleFormValues = z.input<typeof roleSchema>;
