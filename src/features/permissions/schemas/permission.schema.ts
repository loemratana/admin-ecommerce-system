import { z } from "zod";

export const permissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Permission name is required.")
    .max(100, "Permission name must be 100 characters or less."),
  resource: z
    .string()
    .trim()
    .min(1, "Resource is required.")
    .max(50, "Resource must be 50 characters or less."),
  action: z
    .string()
    .trim()
    .min(1, "Action is required.")
    .max(50, "Action must be 50 characters or less."),
  description: z
    .string()
    .trim()
    .max(255, "Description must be 255 characters or less.")
    .optional()
    .transform((val) => (val ? val : undefined)),
});

export type PermissionFormValues = z.input<typeof permissionSchema>;
