import { addDays, dateOnlyUTC } from "@/lib/dates";

// Attendance History date-range presets (US-4.3, MODULE-SPECS Module 4). State
// lives in the URL (ADR-047). All ranges are inclusive date-only bounds in the
// gym's calendar (caller passes gymToday()).

export const DATE_PRESETS = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "custom",
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last30: "Last 30 days",
  custom: "Custom range",
};

export function isDatePreset(value: string | undefined): value is DatePreset {
  return (
    value !== undefined && (DATE_PRESETS as readonly string[]).includes(value)
  );
}

export const VISIT_TYPE_FILTERS = ["all", "MEMBER", "WALK_IN"] as const;
export type VisitTypeFilter = (typeof VISIT_TYPE_FILTERS)[number];

export function isVisitTypeFilter(
  value: string | undefined,
): value is VisitTypeFilter {
  return (
    value !== undefined &&
    (VISIT_TYPE_FILTERS as readonly string[]).includes(value)
  );
}

/**
 * Inclusive `[from, to]` date-only range for a preset. For `custom`, the parsed
 * from/to are used (falling back to today when absent/invalid). `to` is the last
 * day to include — queries should use `visitDate <= to` (date-only).
 */
export function presetRange(
  preset: DatePreset,
  today: Date,
  customFrom?: Date | null,
  customTo?: Date | null,
): { from: Date; to: Date } {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: y, to: y };
    }
    case "last7":
      return { from: addDays(today, -6), to: today };
    case "last30":
      return { from: addDays(today, -29), to: today };
    case "custom": {
      const from = customFrom ? dateOnlyUTC(customFrom) : today;
      const to = customTo ? dateOnlyUTC(customTo) : today;
      // Guard inverted ranges.
      return from.getTime() <= to.getTime()
        ? { from, to }
        : { from: to, to: from };
    }
  }
}
