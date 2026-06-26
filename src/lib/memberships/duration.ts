// Membership plan duration types (US-3.9, MODULE-SPECS Module 3 / Module 9).
// A plan stores `duration_days` (int); ADR-040 renewal math is day-based, so the
// "1/2/3 months" labels map to fixed day counts (ADR-048): 30 / 60 / 90 days.
// "Custom days" carries an owner-entered duration. The Add/Renew membership modal
// also offers an inline ad-hoc "Custom duration" (membership_plan_id = null) that
// reuses CUSTOM here without a saved plan (ADR-015).

export type DurationType = "1_MONTH" | "2_MONTHS" | "3_MONTHS" | "CUSTOM";

export const DURATION_TYPES: readonly DurationType[] = [
  "1_MONTH",
  "2_MONTHS",
  "3_MONTHS",
  "CUSTOM",
] as const;

/** Fixed day counts for the month-based plan types (ADR-048). */
const MONTH_DAYS: Record<Exclude<DurationType, "CUSTOM">, number> = {
  "1_MONTH": 30,
  "2_MONTHS": 60,
  "3_MONTHS": 90,
};

export const DURATION_TYPE_LABELS: Record<DurationType, string> = {
  "1_MONTH": "1 month (30 days)",
  "2_MONTHS": "2 months (60 days)",
  "3_MONTHS": "3 months (90 days)",
  CUSTOM: "Custom days",
};

export function isDurationType(value: string): value is DurationType {
  return (DURATION_TYPES as readonly string[]).includes(value);
}

/** Resolve a duration type + optional custom days to a concrete day count. */
export function durationTypeToDays(
  type: DurationType,
  customDays: number | null | undefined,
): number | null {
  if (type === "CUSTOM") {
    return customDays && customDays > 0 ? customDays : null;
  }
  return MONTH_DAYS[type];
}

/**
 * Best-effort reverse mapping for editing an existing plan: a saved `duration_days`
 * that matches a month type shows that type; anything else is CUSTOM.
 */
export function daysToDurationType(durationDays: number): DurationType {
  for (const [type, days] of Object.entries(MONTH_DAYS)) {
    if (days === durationDays) return type as DurationType;
  }
  return "CUSTOM";
}

/** Human-readable duration for plan/membership display, e.g. "30 days (1 month)". */
export function durationDaysLabel(durationDays: number): string {
  const type = daysToDurationType(durationDays);
  const months: Partial<Record<DurationType, string>> = {
    "1_MONTH": "1 month",
    "2_MONTHS": "2 months",
    "3_MONTHS": "3 months",
  };
  const suffix = months[type];
  return suffix ? `${durationDays} days (${suffix})` : `${durationDays} days`;
}
