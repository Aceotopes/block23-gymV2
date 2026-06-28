import { z } from "zod";
import { ADJUSTMENT_REASON_CATEGORIES } from "@/lib/inventory/adjustment";

// Server-authoritative validation for the Inventory write actions (Flows 9/19,
// TECH-STACK rule 10). Quantities are whole numbers — units or containers for a
// restock (Flow 9), a signed delta for an adjustment (Flow 19). The dialogs do light
// client-side guarding; these schemas are the source of truth.

export const restockSchema = z.object({
  productId: z.string().uuid(),
  // Units (STANDARD) or containers (SERVING_BASED) received — always whole + positive.
  quantityReceived: z
    .number({ error: "Enter a quantity" })
    .int("Whole quantities only")
    .min(1, "Must be at least 1")
    .max(1_000_000, "Too large"),
  // Total invoice amount for the whole restock (US-7.5) — optional, never per-unit.
  totalRestockCost: z
    .number()
    .min(0, "Can't be negative")
    .max(99_999_999, "Too large")
    .nullable(),
});

export type RestockInput = z.infer<typeof restockSchema>;

export const adjustSchema = z
  .object({
    productId: z.string().uuid(),
    // Signed delta: positive = increase, negative = decrease. Never zero (Flow 19).
    quantityDelta: z
      .number({ error: "Enter a quantity" })
      .int("Whole quantities only")
      .min(-1_000_000, "Too large")
      .max(1_000_000, "Too large")
      .refine((n) => n !== 0, "Enter a non-zero adjustment"),
    // Owner-selectable categories only — FORCED_SALE is system-only (ADR-034).
    category: z.enum(ADJUSTMENT_REASON_CATEGORIES),
    note: z.string().trim().max(500, "Note is too long"),
  })
  .superRefine((v, ctx) => {
    if (v.category === "OTHER" && v.note.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "A detail note is required when the reason is Other.",
      });
    }
  });

export type AdjustInput = z.infer<typeof adjustSchema>;
