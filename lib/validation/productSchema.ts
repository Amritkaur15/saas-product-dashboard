import type { ProductInput } from "@/types/product";
import { PRODUCT_CATEGORIES } from "@/types/product";
import { z } from "zod";

// `satisfies` checks this schema's inferred shape against ProductInput
// without widening it, so productInputSchema keeps its ZodObject methods.
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.enum(PRODUCT_CATEGORIES, "Category must be one of the allowed values"),
  price: z.number().positive("Price must be greater than zero"),
  status: z.enum(["active", "inactive"]).optional(),
}) satisfies z.ZodType<ProductInput>;
