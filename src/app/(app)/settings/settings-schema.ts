import { z } from "zod";

// Shared by the client form (validation/UX) and the Server Action (authoritative
// re-validation — TECH-STACK: validate first, query second; never trust the UI).

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Threshold settings: whole number ≥ 1 (zero/negative blocked — US-1.4/1.7/1.8/1.9).
// Inputs are kept as numbers in the form (NaN on empty), so no coercion is needed —
// this keeps the schema's input and output types identical for the RHF resolver.
const threshold = (label: string) =>
  z
    .number({ error: `${label} is required` })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`);

export const gymSettingsSchema = z.object({
  name: z.string().trim().min(1, "Gym name is required").max(120, "Name is too long"),
  address: z.string().trim().max(255, "Address is too long"),
  contactInfo: z.string().trim().max(255, "Contact info is too long"),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .refine(isValidTimeZone, "Select a valid IANA timezone"),
  defaultWalkinFee: z
    .number({ error: "Default walk-in fee is required" })
    .min(0, "Fee cannot be negative")
    .max(1_000_000, "Fee is too large"),
  expirationWarningDays: threshold("Expiring-soon threshold"),
  walkinInactivityThresholdDays: threshold("Walk-in inactivity threshold"),
  memberInactivityWarningDays: threshold("At-risk member threshold"),
  walkinConversionPromptVisits: threshold("Walk-in conversion threshold"),
});

export type GymSettingsValues = z.infer<typeof gymSettingsSchema>;
