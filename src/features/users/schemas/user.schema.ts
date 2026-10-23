import { z } from "zod";

export const userSchema = z
  .object({
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    firstName: z.string().min(3, "At least 3 characters"),
    lastName: z.string().min(3, "At least 3 characters"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export type UserFormValues = z.infer<typeof userSchema>;
