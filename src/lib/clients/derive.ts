import { daysBetween, addDays } from "@/lib/dates";

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

// ── Membership lifecycle actions (Milestone 3 — US-3.1/3.2, ADR-037/040) ─────

/**
 * Context-aware membership action for the Client Profile button (US-3.2):
 *  - `add`           — no non-cancelled membership history → "Add membership"
 *  - `renew`         — expired OR expiring-soon → "Renew"
 *  - `renew-early`   — active and not near expiry → "Renew early"
 *  - `upcoming-only` — the only membership is upcoming (not yet begun); neither
 *                      Renew nor Renew early applies — a disabled/informational
 *                      state until it becomes active (ADR-037).
 */
export type MembershipAction = "add" | "renew" | "renew-early" | "upcoming-only";

export function deriveMembershipAction(
  memberships: MembershipForDerivation[],
  today: Date,
  expirationWarningDays: number,
): MembershipAction {
  const active = memberships.filter(
    (m) => m.cancelledAt === null && isInEffect(m, today),
  );
  const upcoming = memberships.filter(
    (m) => m.cancelledAt === null && m.startDate.getTime() > today.getTime(),
  );
  const anyHistory = memberships.some((m) => m.cancelledAt === null);

  if (!anyHistory) return "add";

  if (active.length > 0) {
    // Active: "Renew" if within the expiring-soon window, else "Renew early".
    const end = maxEndDate(active)!;
    return daysBetween(today, end) <= expirationWarningDays
      ? "renew"
      : "renew-early";
  }

  // No active membership. Upcoming-only → informational; otherwise expired → renew.
  if (upcoming.length > 0) return "upcoming-only";
  return "renew";
}

/**
 * Whether creating a NEW membership is blocked (US-3.1, ADR-037). At most one
 * in-effect membership per client; an upcoming membership also blocks creation.
 * Active takes precedence (offers a "Go to Renew" redirect); upcoming is an
 * informational block with no redirect. Cancelled memberships never count.
 */
export type MembershipBlock =
  | { kind: "active"; endDate: Date }
  | { kind: "upcoming"; startDate: Date }
  | null;

export function deriveMembershipBlock(
  memberships: MembershipForDerivation[],
  today: Date,
): MembershipBlock {
  const live = memberships.filter((m) => m.cancelledAt === null);
  const active = live.filter((m) => isInEffect(m, today));
  if (active.length > 0) {
    return { kind: "active", endDate: maxEndDate(active)! };
  }
  const upcoming = live.filter((m) => m.startDate.getTime() > today.getTime());
  if (upcoming.length > 0) {
    const soonest = upcoming.reduce((a, b) =>
      b.startDate.getTime() < a.startDate.getTime() ? b : a,
    );
    return { kind: "upcoming", startDate: soonest.startDate };
  }
  return null;
}

/**
 * The anchor end date for renewal math (ADR-040): the greatest `end_date` among
 * the client's non-cancelled memberships with `end_date >= today`. Null when the
 * client is fully expired (no membership reaches today).
 */
export function latestRelevantEnd(
  memberships: MembershipForDerivation[],
  today: Date,
): Date | null {
  const relevant = memberships.filter(
    (m) => m.cancelledAt === null && m.endDate.getTime() >= today.getTime(),
  );
  return maxEndDate(relevant);
}

/**
 * Canonical renewal date math (ADR-040): new `start_date = max(today, anchor + 1)`,
 * new `end_date = start_date + duration_days`. `anchorEnd` is `latestRelevantEnd`
 * (null when fully expired → start today). Pure: callers pass the anchor so both
 * the server action and the client-side preview compute identical dates.
 */
export function computeRenewalDates(
  anchorEnd: Date | null,
  durationDays: number,
  today: Date,
): { startDate: Date; endDate: Date } {
  const chained = anchorEnd ? addDays(anchorEnd, 1) : today;
  const startDate =
    chained.getTime() > today.getTime() ? chained : today;
  return { startDate, endDate: addDays(startDate, durationDays) };
}

// ── Check-in branch (Milestone 4 — US-4.1, Flow 14, ADR-018) ────────────────

/**
 * Which check-in branch a client falls into (Flow 14):
 *  - `active-member`   — has an in-effect membership → single "Check In" (MEMBER)
 *  - `upcoming-member` — MEMBER-type, only an upcoming membership → checks in as a
 *    walk-in today (membership hasn't started; edge case, MODULE-SPECS Module 4)
 *  - `expired-member`  — MEMBER-type, no in-effect/upcoming → renewal decision
 *    prompt (ADR-018: "Check in as walk-in" or "Renew"), never silent routing
 *  - `walk-in`         — WALK_IN-type → conversion-prompt check, then fee
 */
export type CheckInBranch =
  | "active-member"
  | "upcoming-member"
  | "expired-member"
  | "walk-in";

export function deriveCheckInBranch(d: DerivedClient): CheckInBranch {
  if (d.isActiveMembership) return "active-member";
  if (d.clientType === "MEMBER") {
    return d.hasUpcomingMembership ? "upcoming-member" : "expired-member";
  }
  return "walk-in";
}

/**
 * The id of the in-effect membership to snapshot onto an Attendance record at
 * check-in (the furthest-ending in-effect, non-cancelled membership), or null.
 */
export function activeMembershipId<
  T extends MembershipForDerivation & { id: string },
>(memberships: T[], today: Date): string | null {
  const inEffect = memberships.filter(
    (m) => m.cancelledAt === null && isInEffect(m, today),
  );
  if (inEffect.length === 0) return null;
  return inEffect.reduce((a, b) =>
    b.endDate.getTime() > a.endDate.getTime() ? b : a,
  ).id;
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
