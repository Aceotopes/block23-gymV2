// Pure membership-report aggregation helpers (Module 8 — US-8.16/8.17/8.19). No DB
// or session access; callers pass already-fetched rows. New vs. renewal is a structural
// property of the schema (`renewed_from_membership_id` null/not — ADR self-FK, MODULE-
// SPECS §8), never a heuristic. Cancelled memberships (ADR-041) are excluded by the
// caller before these run. Dates are `@db.Date` (UTC midnight); `created_at` is an
// instant the caller has already bounded to the gym calendar.

/** A membership is a renewal when it chains off a prior record (ADR-040 / self-FK). */
export function isRenewal(m: { renewedFromMembershipId: string | null }): boolean {
  return m.renewedFromMembershipId !== null;
}

/**
 * Renewal rate % = renewals ÷ (new + renewals) × 100 — the share of memberships
 * sold that were existing members returning (US-8.16). Null when nothing was sold
 * (renders as "—"), so an empty period never shows a misleading 0%.
 */
export function renewalRate(
  newCount: number,
  renewalCount: number,
): number | null {
  const denom = newCount + renewalCount;
  return denom === 0 ? null : (renewalCount / denom) * 100;
}

export type MonthBucket = {
  /** `YYYY-MM` sort/lookup key. */
  key: string;
  /** Display label, e.g. "Jun 2026". */
  label: string;
  year: number;
  /** 0-based month (matches Date.getUTCMonth). */
  month: number;
  /** First calendar day of the month (UTC midnight, `@db.Date`-ready). */
  from: Date;
  /** Last calendar day of the month (UTC midnight). */
  to: Date;
};

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  year: "numeric",
});

/**
 * Full calendar-month buckets spanning the inclusive `[from, to]` range (US-8.19 /
 * US-8.16 monthly rows). Each bucket carries its own first/last day — months are not
 * clipped to the range, so a partial first/last month still reports the whole month.
 */
export function monthBuckets(from: Date, to: Date): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  const endY = to.getUTCFullYear();
  const endM = to.getUTCMonth();
  while (y < endY || (y === endY && m <= endM)) {
    const first = new Date(Date.UTC(y, m, 1));
    const last = new Date(Date.UTC(y, m + 1, 0));
    buckets.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: MONTH_LABEL.format(first),
      year: y,
      month: m,
      from: first,
      to: last,
    });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return buckets;
}
