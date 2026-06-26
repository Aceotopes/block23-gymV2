import { describe, it, expect } from "vitest";
import {
  deriveClient,
  matchesChip,
  deriveMembershipStatus,
  deriveMembershipAction,
  deriveMembershipBlock,
  latestRelevantEnd,
  computeRenewalDates,
  type MembershipForDerivation,
} from "./derive";

const today = new Date("2026-06-26T00:00:00.000Z");
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

const thresholds = {
  expirationWarningDays: 7,
  walkinInactivityThresholdDays: 7,
  memberInactivityWarningDays: 14,
};

function derive(
  memberships: MembershipForDerivation[],
  lastVisitDate: Date | null,
  totalVisits = lastVisitDate ? 1 : 0,
) {
  return deriveClient({
    memberships,
    lastVisitDate,
    totalVisits,
    today,
    thresholds,
  });
}

const active: MembershipForDerivation = {
  startDate: d("2026-06-01"),
  endDate: d("2026-07-26"),
  cancelledAt: null,
};

describe("deriveClient — walk-in", () => {
  it("recent visit is ACTIVE", () => {
    const r = derive([], d("2026-06-24"));
    expect(r.clientType).toBe("WALK_IN");
    expect(r.status).toBe("ACTIVE");
  });

  it("stale visit is INACTIVE", () => {
    const r = derive([], d("2026-06-01"));
    expect(r.status).toBe("INACTIVE");
  });

  it("never visited is INACTIVE with null daysSinceLastVisit", () => {
    const r = derive([], null);
    expect(r.status).toBe("INACTIVE");
    expect(r.daysSinceLastVisit).toBeNull();
    expect(r.atRisk).toBe(false);
  });
});

describe("deriveClient — member status", () => {
  it("in-effect membership is ACTIVE", () => {
    const r = derive([active], d("2026-06-25"));
    expect(r.clientType).toBe("MEMBER");
    expect(r.status).toBe("ACTIVE");
    expect(r.isActiveMembership).toBe(true);
    expect(r.atRisk).toBe(false);
  });

  it("ending within the warning window is EXPIRING_SOON", () => {
    const soon: MembershipForDerivation = {
      startDate: d("2026-06-01"),
      endDate: d("2026-06-30"),
      cancelledAt: null,
    };
    const r = derive([soon], d("2026-06-25"));
    expect(r.status).toBe("EXPIRING_SOON");
    expect(r.expiringSoon).toBe(true);
  });

  it("future-dated membership is UPCOMING (ADR-037)", () => {
    const upcoming: MembershipForDerivation = {
      startDate: d("2026-07-01"),
      endDate: d("2026-08-01"),
      cancelledAt: null,
    };
    const r = derive([upcoming], null);
    expect(r.status).toBe("UPCOMING");
    expect(r.hasUpcomingMembership).toBe(true);
    expect(r.atRisk).toBe(false);
  });

  it("past membership is EXPIRED but still MEMBER", () => {
    const expired: MembershipForDerivation = {
      startDate: d("2026-01-01"),
      endDate: d("2026-02-01"),
      cancelledAt: null,
    };
    const r = derive([expired], null);
    expect(r.clientType).toBe("MEMBER");
    expect(r.status).toBe("EXPIRED");
  });
});

describe("deriveClient — at risk (ADR-019/040)", () => {
  it("active membership + absence beyond threshold is at risk", () => {
    const r = derive([active], d("2026-06-01")); // 25 days ago > 14
    expect(r.atRisk).toBe(true);
    expect(r.status).toBe("ACTIVE");
  });

  it("active membership with no attendance is at risk", () => {
    const r = derive([active], null);
    expect(r.atRisk).toBe(true);
  });

  it("upcoming member is never at risk", () => {
    const upcoming: MembershipForDerivation = {
      startDate: d("2026-07-01"),
      endDate: d("2026-08-01"),
      cancelledAt: null,
    };
    const r = derive([upcoming], null);
    expect(r.atRisk).toBe(false);
  });
});

describe("deriveClient — cancelled exclusion (ADR-041)", () => {
  it("a cancelled membership does not make a MEMBER", () => {
    const cancelled: MembershipForDerivation = {
      startDate: d("2026-06-01"),
      endDate: d("2026-07-26"),
      cancelledAt: d("2026-06-10"),
    };
    const r = derive([cancelled], d("2026-06-25"));
    expect(r.clientType).toBe("WALK_IN");
    expect(r.isActiveMembership).toBe(false);
  });
});

describe("matchesChip", () => {
  it("active member matches active, not expired", () => {
    const r = derive([active], d("2026-06-25"));
    expect(matchesChip(r, "active")).toBe(true);
    expect(matchesChip(r, "expired")).toBe(false);
    expect(matchesChip(r, "all")).toBe(true);
  });

  it("inactive walk-in matches inactive and walk-in-only", () => {
    const r = derive([], d("2026-06-01"));
    expect(matchesChip(r, "inactive")).toBe(true);
    expect(matchesChip(r, "walk-in-only")).toBe(true);
    expect(matchesChip(r, "at-risk")).toBe(false);
  });

  it("at-risk member matches at-risk and active simultaneously", () => {
    const r = derive([active], null);
    expect(matchesChip(r, "at-risk")).toBe(true);
    expect(matchesChip(r, "active")).toBe(true);
  });
});

describe("deriveMembershipStatus", () => {
  it("reports CANCELLED regardless of dates", () => {
    expect(
      deriveMembershipStatus(
        {
          startDate: d("2026-06-01"),
          endDate: d("2026-07-26"),
          cancelledAt: d("2026-06-10"),
        },
        today,
        7,
      ),
    ).toBe("CANCELLED");
  });

  it("reports EXPIRING_SOON within the window", () => {
    expect(
      deriveMembershipStatus(
        {
          startDate: d("2026-06-01"),
          endDate: d("2026-06-30"),
          cancelledAt: null,
        },
        today,
        7,
      ),
    ).toBe("EXPIRING_SOON");
  });
});

const expired: MembershipForDerivation = {
  startDate: d("2026-01-01"),
  endDate: d("2026-02-01"),
  cancelledAt: null,
};
const upcoming: MembershipForDerivation = {
  startDate: d("2026-07-01"),
  endDate: d("2026-08-01"),
  cancelledAt: null,
};
const expiringSoon: MembershipForDerivation = {
  startDate: d("2026-06-01"),
  endDate: d("2026-06-30"), // 4 days out (≤7)
  cancelledAt: null,
};

describe("deriveMembershipAction (US-3.2, ADR-037)", () => {
  it("no history → add", () => {
    expect(deriveMembershipAction([], today, 7)).toBe("add");
  });

  it("only cancelled history → add", () => {
    expect(
      deriveMembershipAction([{ ...active, cancelledAt: d("2026-06-10") }], today, 7),
    ).toBe("add");
  });

  it("active and not near expiry → renew-early", () => {
    expect(deriveMembershipAction([active], today, 7)).toBe("renew-early");
  });

  it("active within the expiring-soon window → renew", () => {
    expect(deriveMembershipAction([expiringSoon], today, 7)).toBe("renew");
  });

  it("expired → renew", () => {
    expect(deriveMembershipAction([expired], today, 7)).toBe("renew");
  });

  it("upcoming-only → upcoming-only (informational)", () => {
    expect(deriveMembershipAction([upcoming], today, 7)).toBe("upcoming-only");
  });

  it("active + upcoming (early renewal) → renew-early (active precedence)", () => {
    expect(deriveMembershipAction([active, upcoming], today, 7)).toBe(
      "renew-early",
    );
  });
});

describe("deriveMembershipBlock (US-3.1, ADR-037)", () => {
  it("no live memberships → not blocked", () => {
    expect(deriveMembershipBlock([], today)).toBeNull();
    expect(deriveMembershipBlock([expired], today)).toBeNull();
  });

  it("active membership blocks with end date (Go to Renew)", () => {
    const b = deriveMembershipBlock([active], today);
    expect(b).toEqual({ kind: "active", endDate: active.endDate });
  });

  it("upcoming membership blocks informationally with start date", () => {
    const b = deriveMembershipBlock([upcoming], today);
    expect(b).toEqual({ kind: "upcoming", startDate: upcoming.startDate });
  });

  it("active takes precedence over upcoming", () => {
    const b = deriveMembershipBlock([upcoming, active], today);
    expect(b?.kind).toBe("active");
  });

  it("cancelled active membership does not block", () => {
    const b = deriveMembershipBlock(
      [{ ...active, cancelledAt: d("2026-06-10") }],
      today,
    );
    expect(b).toBeNull();
  });
});

describe("computeRenewalDates + latestRelevantEnd (ADR-040)", () => {
  it("fully expired → starts today", () => {
    const anchor = latestRelevantEnd([expired], today);
    expect(anchor).toBeNull();
    const r = computeRenewalDates(anchor, 30, today);
    expect(r.startDate).toEqual(today);
    expect(r.endDate).toEqual(d("2026-07-26"));
  });

  it("active → chains onto latest end + 1 day (new record upcoming)", () => {
    const anchor = latestRelevantEnd([active], today); // 2026-07-26
    const r = computeRenewalDates(anchor, 30, today);
    expect(r.startDate).toEqual(d("2026-07-27"));
    expect(r.endDate).toEqual(d("2026-08-26"));
  });

  it("stacked early renewal chains onto the furthest-future end", () => {
    const anchor = latestRelevantEnd([active, upcoming], today); // 2026-08-01
    const r = computeRenewalDates(anchor, 60, today);
    expect(r.startDate).toEqual(d("2026-08-02"));
    expect(r.endDate).toEqual(d("2026-10-01"));
  });

  it("ignores cancelled memberships when finding the anchor", () => {
    const anchor = latestRelevantEnd(
      [{ ...active, cancelledAt: d("2026-06-10") }],
      today,
    );
    expect(anchor).toBeNull();
  });
});
