import { addDays, dateOnlyUTC } from "@/lib/dates";

// Pure attendance-analytics aggregations (US-4.10). All inputs are already-fetched
// rows; no DB/session access. `visitDate` is a `@db.Date` (UTC midnight) and `timeIn`
// a `@db.Time` (UTC clock) per ADR-035, so day/hour bucketing uses UTC parts.

export type AttRow = {
  clientId: string;
  visitType: "MEMBER" | "WALK_IN";
  visitDate: Date;
  timeIn: Date;
};

export const ANALYTICS_PERIODS = ["last7", "last30", "last90", "custom"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  last7: "Last 7 days",
  last30: "Last 30 days",
  last90: "Last 3 months",
  custom: "Custom range",
};

export function isAnalyticsPeriod(v: string | undefined): v is AnalyticsPeriod {
  return v !== undefined && (ANALYTICS_PERIODS as readonly string[]).includes(v);
}

/** Inclusive `[from, to]` date-only range for an analytics period. */
export function analyticsRange(
  period: AnalyticsPeriod,
  today: Date,
  customFrom?: Date | null,
  customTo?: Date | null,
): { from: Date; to: Date } {
  switch (period) {
    case "last7":
      return { from: addDays(today, -6), to: today };
    case "last30":
      return { from: addDays(today, -29), to: today };
    case "last90":
      return { from: addDays(today, -89), to: today };
    case "custom": {
      const from = customFrom ? dateOnlyUTC(customFrom) : addDays(today, -29);
      const to = customTo ? dateOnlyUTC(customTo) : today;
      return from.getTime() <= to.getTime()
        ? { from, to }
        : { from: to, to: from };
    }
  }
}

/** Whole days in an inclusive range. */
export function rangeDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dailyTrend(
  rows: AttRow[],
  from: Date,
  to: Date,
): { date: string; total: number; unique: number }[] {
  const byDay = new Map<string, { total: number; clients: Set<string> }>();
  for (const r of rows) {
    const key = r.visitDate.toISOString().slice(0, 10);
    const e = byDay.get(key) ?? { total: 0, clients: new Set<string>() };
    e.total += 1;
    e.clients.add(r.clientId);
    byDay.set(key, e);
  }
  const out: { date: string; total: number; unique: number }[] = [];
  for (let d = dateOnlyUTC(from); d.getTime() <= to.getTime(); d = addDays(d, 1)) {
    const key = d.toISOString().slice(0, 10);
    const e = byDay.get(key);
    out.push({ date: key, total: e?.total ?? 0, unique: e?.clients.size ?? 0 });
  }
  return out;
}

export function byHour(rows: AttRow[]): { hour: number; count: number }[] {
  const counts = new Array<number>(24).fill(0);
  for (const r of rows) counts[r.timeIn.getUTCHours()] += 1;
  return counts.map((count, hour) => ({ hour, count }));
}

export function byDayOfWeek(
  rows: AttRow[],
  from: Date,
  to: Date,
): { dow: number; label: string; total: number; avg: number }[] {
  const totals = new Array<number>(7).fill(0);
  for (const r of rows) totals[r.visitDate.getUTCDay()] += 1;
  const occ = new Array<number>(7).fill(0);
  for (let d = dateOnlyUTC(from); d.getTime() <= to.getTime(); d = addDays(d, 1)) {
    occ[d.getUTCDay()] += 1;
  }
  return totals.map((total, dow) => ({
    dow,
    label: DOW_LABELS[dow],
    total,
    avg: occ[dow] ? total / occ[dow] : 0,
  }));
}

/** Top N hours by check-in volume (excludes empty hours). */
export function peakHours(
  hours: { hour: number; count: number }[],
  n = 3,
): { hour: number; count: number }[] {
  return [...hours]
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Top N weekdays by total check-ins (excludes empty days). */
export function peakDays(
  dows: { dow: number; label: string; total: number; avg: number }[],
  n = 3,
): { label: string; total: number }[] {
  return [...dows]
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, n)
    .map((d) => ({ label: d.label, total: d.total }));
}

/**
 * New vs returning visitors in [from, to] (US-4.10). A client is New if their
 * first-ever check-in falls within the period; otherwise Returning. Counts unique
 * clients who visited in the period.
 */
export function newVsReturning(
  rows: AttRow[],
  firstEver: Map<string, Date>,
  from: Date,
  to: Date,
): { newCount: number; returningCount: number } {
  const inPeriod = new Set(rows.map((r) => r.clientId));
  let newCount = 0;
  for (const clientId of inPeriod) {
    const first = firstEver.get(clientId);
    if (
      first &&
      first.getTime() >= from.getTime() &&
      first.getTime() <= to.getTime()
    ) {
      newCount += 1;
    }
  }
  return { newCount, returningCount: inPeriod.size - newCount };
}

export function hourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${hour < 12 ? "am" : "pm"}`;
}
