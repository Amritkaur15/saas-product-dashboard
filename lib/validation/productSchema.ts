import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/types/product";
import type { ProductInput } from "@/types/product";

// `satisfies` checks this schema's inferred shape against ProductInput
// without widening it, so productInputSchema keeps its ZodObject methods.
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.enum(PRODUCT_CATEGORIES, "Category must be one of the allowed values"),
  price: z.number().nonnegative("Price must be zero or greater"),
  status: z.enum(["active", "inactive"]).optional(),
}) satisfies z.ZodType<ProductInput>;
