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

/** Display an ISO `YYYY-MM-DD` string (or null) as a short date, UTC (no shift). */
export function formatDateOnlyISO(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? "—" : formatDateOnly(d);
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

/**
 * The current wall-clock time in the gym's timezone, as a `@db.Time`-ready Date
 * whose UTC clock equals the gym-local clock (ADR-035 — times are bare clock
 * values, no offset). Used to stamp `Attendance.time_in` at check-in.
 */
export function gymTimeNow(timeZone: string): Date {
  const hms = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
  // en-GB gives HH:mm:ss (24h). "24:00:00" can appear at midnight — normalize.
  const safe = hms.startsWith("24") ? `00${hms.slice(2)}` : hms;
  return new Date(`1970-01-01T${safe}.000Z`);
}

/**
 * Parse an `HH:mm` string (from an `<input type="time">`) to a `@db.Time`-ready
 * UTC Date. Returns null if malformed (incl. out-of-range hour/minute).
 */
export function parseTimeOnly(value: string): Date | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return new Date(`1970-01-01T${m[1]}:${m[2]}:00.000Z`);
}

/** Serialize a `@db.Time` value to `HH:mm` (for an `<input type="time">`). */
export function toTimeInputValue(d: Date): string {
  return d.toISOString().slice(11, 16);
}

/**
 * Display a UTC instant (e.g. `transaction_date`) as a date + time in the gym's
 * timezone (ADR-035 — instants convert through `Gym.timezone` for display).
 */
export function formatDateTimeInTz(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Re-read `date` as if its wall-clock fields were UTC, as seen in `timeZone`. */
function partsAsUtc(timeZone: string, date: Date): Date {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  return new Date(
    Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second),
  );
}

/**
 * The UTC instant of local midnight (00:00:00) for calendar day `day` in `timeZone`.
 * `day` is a UTC-midnight date-only value (e.g. from `gymToday`/`parseDateOnly`).
 *
 * Unlike `@db.Date` fields, `transaction_date` is a UTC instant (ADR-035), so
 * bounding it to a gym-local calendar day requires the timezone offset. Build a
 * half-open range with `gymDayStartUtc(tz, day)` and `gymDayStartUtc(tz, addDays(day, 1))`
 * — querying the next day's start (rather than start + 24h) stays correct across DST.
 */
export function gymDayStartUtc(timeZone: string, day: Date): Date {
  const naiveUtc = new Date(`${toDateInputValue(day)}T00:00:00.000Z`);
  const offset = partsAsUtc(timeZone, naiveUtc).getTime() - naiveUtc.getTime();
  return new Date(naiveUtc.getTime() - offset);
}
