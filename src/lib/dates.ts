// Date helpers honoring ADR-035: `@db.Date` fields (start_date, end_date,
// visit_date, date_registered) are stored as local calendar values with NO
// timezone — Prisma surfaces them as a JS Date at UTC midnight. So all date-only
// math and display works in UTC, and "today" is the current calendar date in the
// gym's IANA timezone (Gym.timezone), which governs the "today" boundary.

export const MS_PER_DAY = 86_400_000;

/** Normalize any Date to its UTC-midnight calendar date (drops time + offset). */
export function dateOnlyUTC(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * The current calendar date in the gym's timezone, as a UTC-midnight Date — the
 * canonical "today" for all status derivation and "today" boundary math (ADR-035).
 */
export function gymToday(timeZone: string): Date {
  // en-CA formats as YYYY-MM-DD, which parses cleanly as a UTC calendar date.
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** Whole calendar days from `from` to `to` (negative if `to` precedes `from`). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round(
    (dateOnlyUTC(to).getTime() - dateOnlyUTC(from).getTime()) / MS_PER_DAY,
  );
}

/** Add `n` calendar days to a date-only value, returning a UTC-midnight Date. */
export function addDays(d: Date, n: number): Date {
  return new Date(dateOnlyUTC(d).getTime() + n * MS_PER_DAY);
}

/**
 * Parse a `YYYY-MM-DD` string (from an `<input type="date">`) to a UTC-midnight
 * Date suitable for a `@db.Date` column. Returns null if malformed. No timezone
 * conversion — the value is a bare calendar date (ADR-035).
 */
export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Serialize a UTC-midnight date-only value as `YYYY-MM-DD` (for date inputs). */
export function toDateInputValue(d: Date): string {
  return dateOnlyUTC(d).toISOString().slice(0, 10);
}

/**
 * Display a date-only value (`@db.Date`). Formatted in UTC — the stored value is
 * a bare calendar date, so converting through a timezone would shift the day.
 */
export function formatDateOnly(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Display a `@db.Time` value (e.g. Attendance.time_in). Like date-only fields,
 * times are stored as bare local clock values (ADR-035), so format in UTC.
 */
export function formatTimeOnly(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
