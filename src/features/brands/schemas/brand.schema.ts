import { z } from "zod";

// Limits mirror the backend BrandRequest validation.
export const brandSchema = z.object({
  name: z.string().trim().min(1, "Brand name is required.").max(255, "Name must be 255 characters or less."),
  slug: z.string().trim().min(1, "Slug is required.").max(255, "Slug must be 255 characters or less."),
  image: z.string().trim().max(500, "Image URL is too long."),
});

export type BrandFormValues = z.infer<typeof brandSchema>;
