import { dateOnlyUTC, daysBetween } from "@/lib/dates";

// Walk-in → member conversion derivation (ADR-020 — US-8.22 / US-8.8 / US-2.10). A
// client is a converted walk-in when they became a MEMBER and have ≥1 WALK_IN
// attendance record whose `visit_date` predates their earliest non-cancelled
// Membership.created_at. The conversion date is that earliest membership's created_at.
// No conversion entity is stored — every surface derives this identically. Pure: the
// caller passes the client's earliest membership instant + their walk-in visit dates.

export type ConversionInput = {
  /** Earliest non-cancelled Membership.created_at for the client, or null if none. */
  earliestMembershipCreatedAt: Date | null;
  /** `visit_date` of every WALK_IN attendance record for the client (`@db.Date`). */
  walkInVisitDates: Date[];
};

export type Conversion = {
  converted: boolean;
  conversionDate: Date | null;
  firstWalkInDate: Date | null;
  /** WALK_IN visits dated before the conversion date. */
  walkInsBeforeConversion: number;
  /** Whole days from the first qualifying walk-in to the conversion date. */
  daysToConvert: number | null;
};

const NOT_CONVERTED: Conversion = {
  converted: false,
  conversionDate: null,
  firstWalkInDate: null,
  walkInsBeforeConversion: 0,
  daysToConvert: null,
};

export function deriveConversion(input: ConversionInput): Conversion {
  const conv = input.earliestMembershipCreatedAt;
  if (!conv) return NOT_CONVERTED;

  // Walk-ins that predate the conversion instant (ADR-020). visit_date is UTC midnight;
  // a same-day walk-in (midnight) still predates a later-in-the-day membership.created_at.
  const before = input.walkInVisitDates.filter(
    (d) => d.getTime() < conv.getTime(),
  );
  if (before.length === 0) return NOT_CONVERTED;

  const firstWalkInDate = before.reduce((a, b) =>
    b.getTime() < a.getTime() ? b : a,
  );

  return {
    converted: true,
    conversionDate: conv,
    firstWalkInDate,
    walkInsBeforeConversion: before.length,
    daysToConvert: daysBetween(firstWalkInDate, dateOnlyUTC(conv)),
  };
}
