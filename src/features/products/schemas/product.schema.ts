import { z } from "zod";

const basicInfoMessage = "Product name, slug and subcategory are required.";
const variantMessage = "Each variant needs a SKU and a price greater than 0.";

export const productEditorSchema = z.object({
  name: z.string().trim().min(1, basicInfoMessage),
  slug: z.string().trim().min(1, basicInfoMessage),
  subCategoryId: z.string().min(1, basicInfoMessage),
  variants: z
    .array(
      z.object({
        sku: z.string().trim().min(1, variantMessage),
        price: z.coerce.number().gt(0, variantMessage),
      }),
    )
    .min(1, "Add at least one variant."),
});
