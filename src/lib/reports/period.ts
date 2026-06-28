import { addDays, dateOnlyUTC } from "@/lib/dates";

// Shared report period selector (Module 8, US-8.2/8.3/8.4/8.15). Each preset resolves
// to an inclusive date-only range ending today (gym calendar). "This Year" is Jan 1 →
// today (US-8.2). Custom takes the supplied from/to. Pure — callers pass gymToday().
// State lives in the URL (ADR-047). The instant-typed `transaction_date` is bounded by
// the caller via gymDayStartUtc(); date-only `visit_date` uses these bounds directly.

export const REPORT_PERIODS = ["today", "week", "month", "year", "custom"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "This Year",
  custom: "Custom range",
};

export function isReportPeriod(value: string | undefined): value is ReportPeriod {
  return (
    value !== undefined && (REPORT_PERIODS as readonly string[]).includes(value)
  );
}

export function reportRange(
  period: ReportPeriod,
  today: Date,
  customFrom?: Date | null,
  customTo?: Date | null,
): { from: Date; to: Date } {
  switch (period) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const mondayOffset = (today.getUTCDay() + 6) % 7; // Mon-based week
      return { from: addDays(today, -mondayOffset), to: today };
    }
    case "month":
      return {
        from: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
        to: today,
      };
    case "year":
      return {
        from: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)),
        to: today,
      };
    case "custom": {
      const from = customFrom ? dateOnlyUTC(customFrom) : today;
      const to = customTo ? dateOnlyUTC(customTo) : today;
      return from.getTime() <= to.getTime()
        ? { from, to }
        : { from: to, to: from };
    }
  }
}

/**
 * The immediately-preceding range of the same duration (US-8.20). Used for
 * period-over-period comparison: prior `to` = day before `from`; prior `from` =
 * prior `to` − (range length − 1).
 */
export function priorRange(range: { from: Date; to: Date }): {
  from: Date;
  to: Date;
} {
  const lengthDays =
    Math.round(
      (dateOnlyUTC(range.to).getTime() - dateOnlyUTC(range.from).getTime()) /
        86_400_000,
    ) + 1;
  const priorTo = addDays(range.from, -1);
  const priorFrom = addDays(priorTo, -(lengthDays - 1));
  return { from: priorFrom, to: priorTo };
}
