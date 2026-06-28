import { addDays } from "@/lib/dates";

// Dashboard period selector (Module 1) — Today / Week / Month. Plain module (no
// "use client") so both the server view and the client toggle import it. Ranges are
// inclusive date-only bounds in the gym calendar (caller passes gymToday()).

export const DASHBOARD_PERIODS = ["today", "week", "month"] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Today",
  week: "Week",
  month: "Month",
};

export function isDashboardPeriod(v: string | undefined): v is DashboardPeriod {
  return v !== undefined && (DASHBOARD_PERIODS as readonly string[]).includes(v);
}

/** Inclusive `[from, to]` date-only range for the selected period (to = today). */
export function dashboardRange(
  period: DashboardPeriod,
  today: Date,
): { from: Date; to: Date } {
  if (period === "today") return { from: today, to: today };
  if (period === "week") {
    const mondayOffset = (today.getUTCDay() + 6) % 7; // Mon-based week
    return { from: addDays(today, -mondayOffset), to: today };
  }
  // month-to-date
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  return { from: monthStart, to: today };
}
