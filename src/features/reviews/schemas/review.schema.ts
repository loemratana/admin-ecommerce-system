import { z } from "zod";

export const reviewSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  ratings: z.coerce.number().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5."),
  comment: z.string().trim().min(1, "Comment is required."),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
