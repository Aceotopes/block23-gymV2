import { z } from "zod";
import { DURATION_TYPES, type DurationType } from "@/lib/memberships/duration";

// Shared by the Membership Plan form (client UX) and the plan Server Actions
// (authoritative re-validation — TECH-STACK rule 10). Numbers stay numeric (NaN on
// empty) so the RHF resolver's input/output types match (no z.coerce). US-3.9.

export const planSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
    durationType: z.enum(DURATION_TYPES as unknown as [DurationType, ...DurationType[]]),
    // Required only when durationType is CUSTOM; ignored otherwise.
    customDays: z.number().int().max(3650, "Too long").nullable(),
    defaultPrice: z
      .number({ error: "Enter a price" })
      .min(0, "Price can't be negative")
      .max(9_999_999, "Price is too large"),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.durationType === "CUSTOM") {
      if (
        v.customDays === null ||
        Number.isNaN(v.customDays) ||
        v.customDays < 1
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["customDays"],
          message: "Enter a duration of at least 1 day",
        });
      }
    }
  });

export type PlanFormValues = z.infer<typeof planSchema>;

export const planFormDefaults: PlanFormValues = {
  name: "",
  durationType: "1_MONTH",
  customDays: null,
  defaultPrice: Number.NaN,
  isActive: true,
};
