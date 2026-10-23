import { z } from "zod";

export const sizeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim(),
});

export type SizeFormValues = z.infer<typeof sizeSchema>;
