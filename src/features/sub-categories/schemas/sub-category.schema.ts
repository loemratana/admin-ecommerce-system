import { z } from "zod";

// Limits mirror the backend SubCategoryRequest validation.
export const subCategorySchema = z.object({
  name: z.string().trim().min(1, "Sub-category name is required.").max(255, "Name must be 255 characters or less."),
  slug: z.string().trim().min(1, "Slug is required.").max(255, "Slug must be 255 characters or less."),
  categoryId: z.string().min(1, "Parent category is required.").transform(Number),
  image: z.string().trim().max(2048, "Image URL is too long."),
});

/** Shape of the dialog form (categoryId is the raw select value). */
export type SubCategoryFormValues = z.input<typeof subCategorySchema>;
