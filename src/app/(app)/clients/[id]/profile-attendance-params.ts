// Pure URL params for the Client Profile's Attendance History filters (US-4.3,
// ADR-047). Kept free of "use client" so the server profile page can call the guard
// directly — a helper exported from a client module becomes a client reference and
// can't be invoked on the server. The client filter component imports these too.

export const PROFILE_RANGES = ["all", "today", "last7", "last30"] as const;
export type ProfileRange = (typeof PROFILE_RANGES)[number];

export const PROFILE_RANGE_LABELS: Record<ProfileRange, string> = {
  all: "All time",
  today: "Today",
  last7: "Last 7 days",
  last30: "Last 30 days",
};

export function isProfileRange(v: string | undefined): v is ProfileRange {
  return v !== undefined && (PROFILE_RANGES as readonly string[]).includes(v);
}
