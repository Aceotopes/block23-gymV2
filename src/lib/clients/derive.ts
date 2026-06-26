import { daysBetween } from "@/lib/dates";

// ─────────────────────────────────────────────────────────────────────────────
// Centralized client derivation (ADR-002/017/019/037/040). client_type, status,
// and the at-risk signal are NEVER stored — they are computed from memberships +
// attendance at query time. Every surface (Client List chips, Client Profile, the
// future Dashboard panels and Reports) MUST derive through this module so they all
// agree. Nothing here touches the database or the session — callers pass already-
// fetched rows plus the gym thresholds and "today" (gymToday()).
// ─────────────────────────────────────────────────────────────────────────────

export type ClientType = "MEMBER" | "WALK_IN";
/** Member status with ADR-037 precedence: EXPIRING_SOON → ACTIVE → UPCOMING → EXPIRED. */
export type MemberStatus = "ACTIVE" | "UPCOMING" | "EXPIRING_SOON" | "EXPIRED";
export type WalkInStatus = "ACTIVE" | "INACTIVE";

/** Minimal membership shape the derivation needs (dates are `@db.Date` → UTC midnight). */
export type MembershipForDerivation = {
  startDate: Date;
  endDate: Date;
  cancelledAt: Date | null;
};

export type DeriveInput = {
  /** All membership rows for the client (cancelled ones are filtered here — ADR-041). */
  memberships: MembershipForDerivation[];
  /** Most recent `Attendance.visit_date`, or null if the client has never visited. */
  lastVisitDate: Date | null;
  totalVisits: number;
  today: Date;
  thresholds: {
    expirationWarningDays: number;
    walkinInactivityThresholdDays: number;
    memberInactivityWarningDays: number;
  };
};

export type DerivedClient = {
  clientType: ClientType;
  /** Unified status label key (member or walk-in, depending on clientType). */
  status: MemberStatus | WalkInStatus;
  memberStatus: MemberStatus | null;
  walkInStatus: WalkInStatus | null;
  isActiveMembership: boolean;
  hasUpcomingMembership: boolean;
  expiringSoon: boolean;
  atRisk: boolean;
  /** End date to surface for members (active end, else next upcoming, else most recent). Null for walk-ins. */
  membershipExpiry: Date | null;
  daysUntilExpiry: number | null;
  lastVisitDate: Date | null;
  daysSinceLastVisit: number | null;
  totalVisits: number;
};

/** Canonical "in effect" test (ADR-040): start_date ≤ today ≤ end_date. */
function isInEffect(m: MembershipForDerivation, today: Date): boolean {
  return (
    m.startDate.getTime() <= today.getTime() &&
    today.getTime() <= m.endDate.getTime()
  );
}

function maxEndDate(rows: MembershipForDerivation[]): Date | null {
  if (rows.length === 0) return null;
  return rows.reduce((a, b) =>
    b.endDate.getTime() > a.endDate.getTime() ? b : a,
  ).endDate;
}

export function deriveClient(input: DeriveInput): DerivedClient {
  const { lastVisitDate, totalVisits, today, thresholds } = input;

  // ADR-041: cancelled memberships are excluded from EVERY derivation.
  const memberships = input.memberships.filter((m) => m.cancelledAt === null);

  const clientType: ClientType = memberships.length > 0 ? "MEMBER" : "WALK_IN";

  const daysSinceLastVisit = lastVisitDate
    ? daysBetween(lastVisitDate, today)
    : null;

  if (clientType === "WALK_IN") {
    const walkActive =
      daysSinceLastVisit !== null &&
      daysSinceLastVisit <= thresholds.walkinInactivityThresholdDays;
    const walkInStatus: WalkInStatus = walkActive ? "ACTIVE" : "INACTIVE";
    return {
      clientType,
      status: walkInStatus,
      memberStatus: null,
      walkInStatus,
      isActiveMembership: false,
      hasUpcomingMembership: false,
      expiringSoon: false,
      atRisk: false,
      membershipExpiry: null,
      daysUntilExpiry: null,
      lastVisitDate,
      daysSinceLastVisit,
      totalVisits,
    };
  }

  // ── MEMBER ──
  const inEffect = memberships.filter((m) => isInEffect(m, today));
  const upcoming = memberships.filter(
    (m) => m.startDate.getTime() > today.getTime(),
  );
  const isActiveMembership = inEffect.length > 0;
  const hasUpcomingMembership = upcoming.length > 0;

  // Active end = furthest end among in-effect rows (early renewal can stack ACTIVE+UPCOMING).
  const activeEnd = maxEndDate(inEffect);
  const daysUntilExpiry = activeEnd ? daysBetween(today, activeEnd) : null;
  const expiringSoon =
    isActiveMembership &&
    daysUntilExpiry !== null &&
    daysUntilExpiry <= thresholds.expirationWarningDays;

  let memberStatus: MemberStatus;
  if (expiringSoon) memberStatus = "EXPIRING_SOON";
  else if (isActiveMembership) memberStatus = "ACTIVE";
  else if (hasUpcomingMembership) memberStatus = "UPCOMING";
  else memberStatus = "EXPIRED";

  // Expiry to display: active end → soonest upcoming end → most recent end (expired).
  let membershipExpiry: Date | null;
  if (isActiveMembership) membershipExpiry = activeEnd;
  else if (hasUpcomingMembership) {
    membershipExpiry = upcoming.reduce((a, b) =>
      b.startDate.getTime() < a.startDate.getTime() ? b : a,
    ).endDate;
  } else membershipExpiry = maxEndDate(memberships);

  // At risk (ADR-019/040): an in-effect membership + last visit beyond the member
  // inactivity window, OR an in-effect membership with no attendance at all.
  // UPCOMING members are excluded (their period has not begun).
  const atRisk =
    isActiveMembership &&
    (daysSinceLastVisit === null ||
      daysSinceLastVisit > thresholds.memberInactivityWarningDays);

  return {
    clientType,
    status: memberStatus,
    memberStatus,
    walkInStatus: null,
    isActiveMembership,
    hasUpcomingMembership,
    expiringSoon,
    atRisk,
    membershipExpiry,
    daysUntilExpiry,
    lastVisitDate,
    daysSinceLastVisit,
    totalVisits,
  };
}

/**
 * Status of a single membership record (ADR-040). Used by the Client Profile's
 * Membership History and the M3 membership flows. CANCELLED (ADR-041) is reported
 * separately from the lifecycle statuses since a cancelled record is excluded from
 * every other derivation.
 */
export function deriveMembershipStatus(
  m: MembershipForDerivation,
  today: Date,
  expirationWarningDays: number,
): MemberStatus | "CANCELLED" {
  if (m.cancelledAt !== null) return "CANCELLED";
  if (m.startDate.getTime() > today.getTime()) return "UPCOMING";
  if (m.endDate.getTime() < today.getTime()) return "EXPIRED";
  return daysBetween(today, m.endDate) <= expirationWarningDays
    ? "EXPIRING_SOON"
    : "ACTIVE";
}

// ── Filter chips (US-2.9/2.10/2.11, ADR-037) ────────────────────────────────
export const CLIENT_FILTER_CHIPS = [
  "all",
  "active",
  "upcoming",
  "at-risk",
  "expiring-soon",
  "expired",
  "walk-in-only",
  "inactive",
] as const;

export type ClientFilterChip = (typeof CLIENT_FILTER_CHIPS)[number];

export const CHIP_LABELS: Record<ClientFilterChip, string> = {
  all: "All",
  active: "Active",
  upcoming: "Upcoming",
  "at-risk": "At risk",
  "expiring-soon": "Expiring soon",
  expired: "Expired",
  "walk-in-only": "Walk-in only",
  inactive: "Inactive",
};

export function isClientFilterChip(
  value: string | undefined,
): value is ClientFilterChip {
  return (
    value !== undefined &&
    (CLIENT_FILTER_CHIPS as readonly string[]).includes(value)
  );
}

/**
 * Whether a derived client matches a filter chip. A client may match several chips
 * (e.g. "At risk" + "Expiring soon"); chips are single-select on the UI but each is
 * an independent predicate (MODULE-SPECS Module 2). "all" excludes nothing here —
 * the archived toggle is applied separately at the query level.
 */
export function matchesChip(d: DerivedClient, chip: ClientFilterChip): boolean {
  switch (chip) {
    case "all":
      return true;
    case "active":
      return d.clientType === "MEMBER"
        ? d.isActiveMembership
        : d.walkInStatus === "ACTIVE";
    case "upcoming":
      return (
        d.clientType === "MEMBER" &&
        !d.isActiveMembership &&
        d.hasUpcomingMembership
      );
    case "at-risk":
      return d.atRisk;
    case "expiring-soon":
      return d.expiringSoon;
    case "expired":
      return (
        d.clientType === "MEMBER" &&
        !d.isActiveMembership &&
        !d.hasUpcomingMembership
      );
    case "walk-in-only":
      return d.clientType === "WALK_IN";
    case "inactive":
      return d.clientType === "WALK_IN" && d.walkInStatus === "INACTIVE";
  }
}
