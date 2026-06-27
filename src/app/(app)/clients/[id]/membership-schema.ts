import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/payments/method";

// Shared by the Add/Renew membership dialog (client UX) and the membership Server
// Actions (authoritative re-validation — TECH-STACK rule 10). US-3.1/3.2/3.3.
//
// `planChoice` is either a MembershipPlan id (catalog plan) or the literal "custom"
// for an inline ad-hoc duration (membership_plan_id = null, ADR-015). `price` is the
// snapshot recorded on the Membership (overridable, ADR-003). Numbers stay numeric
// (NaN/null on empty) so the RHF resolver input/output types align (no z.coerce).

export const CUSTOM_PLAN = "custom" as const;

const planChoice = z.string().min(1, "Select a plan");
const customDays = z.number().int().max(3650, "Too long").nullable();
const price = z
  .number({ error: "Enter a price" })
  .min(0, "Price can't be negative")
  .max(9_999_999, "Price is too large");
// Payment method captured on the membership's CLIENT_TRANSACTION (US-5.1).
const paymentMethod = z.enum(PAYMENT_METHODS, { error: "Select a payment method" });

function requireCustomDays(
  v: { planChoice: string; customDays: number | null },
  ctx: z.RefinementCtx,
) {
  if (v.planChoice === CUSTOM_PLAN) {
    if (v.customDays === null || Number.isNaN(v.customDays) || v.customDays < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["customDays"],
        message: "Enter a duration of at least 1 day",
      });
    }
  }
}

// Create offers a start date (defaults to today, may be future-dated for pre-purchase).
export const createMembershipSchema = z
  .object({
    planChoice,
    customDays,
    price,
    paymentMethod,
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date"),
  })
  .superRefine(requireCustomDays);

// Renew computes the start date from the renewal math (ADR-040) — no start input.
export const renewMembershipSchema = z
  .object({ planChoice, customDays, price, paymentMethod })
  .superRefine(requireCustomDays);

export type CreateMembershipValues = z.infer<typeof createMembershipSchema>;
export type RenewMembershipValues = z.infer<typeof renewMembershipSchema>;
