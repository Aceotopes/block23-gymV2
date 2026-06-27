import { z } from "zod";
import { PRODUCT_TYPES, type ProductType } from "@/lib/products/types";

// Shared by the Product form (client UX) and the product Server Actions (authoritative
// re-validation — TECH-STACK rule 10). US-6.1/6.2/6.4. Required numbers stay NaN-on-
// empty; optional numbers are nullable (null on empty) so the RHF resolver's input/
// output types line up (no z.coerce). `current_stock` is NOT here — it is ledger-
// driven (ADR-004), set by restocks/sales (M6 Part 2 + M7), never on the catalog form.

const requiredPrice = z
  .number({ error: "Enter a price" })
  .min(0, "Can't be negative")
  .max(9_999_999, "Too large");

const optionalPrice = z
  .number()
  .min(0, "Can't be negative")
  .max(9_999_999, "Too large")
  .nullable();

export const productSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
    categoryId: z.string().min(1, "Select a category"),
    productType: z.enum(PRODUCT_TYPES as unknown as [ProductType, ...ProductType[]]),
    sellingPrice: requiredPrice,
    costPrice: optionalPrice,
    imageUrl: z
      .string()
      .trim()
      .max(2000, "URL is too long")
      .nullable(),
    // SERVING_BASED_PRODUCT only — required for that type (enforced below).
    servingsPerContainer: z
      .number()
      .int("Whole servings only")
      .max(100_000, "Too large")
      .nullable(),
    containerSellingPrice: optionalPrice,
    lowStockThreshold: z
      .number({ error: "Enter a threshold" })
      .min(0, "Can't be negative")
      .max(9_999_999, "Too large"),
    reorderPoint: z
      .number()
      .int("Whole units only")
      .max(9_999_999, "Too large")
      .nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.productType === "SERVING_BASED_PRODUCT") {
      if (
        v.servingsPerContainer === null ||
        Number.isNaN(v.servingsPerContainer) ||
        v.servingsPerContainer < 1
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["servingsPerContainer"],
          message: "Enter the servings per container (at least 1)",
        });
      }
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;

export const productFormDefaults: ProductFormValues = {
  name: "",
  categoryId: "",
  productType: "STANDARD_PRODUCT",
  sellingPrice: Number.NaN,
  costPrice: null,
  imageUrl: null,
  servingsPerContainer: null,
  containerSellingPrice: null,
  lowStockThreshold: Number.NaN,
  reorderPoint: null,
};

/**
 * Normalize a parsed product so STANDARD products never carry serving-based fields
 * (container price / servings only apply to SERVING_BASED — DOMAIN-MODEL Product).
 */
export function normalizeProduct(v: ProductFormValues): ProductFormValues {
  if (v.productType === "STANDARD_PRODUCT") {
    return { ...v, servingsPerContainer: null, containerSellingPrice: null };
  }
  return v;
}
