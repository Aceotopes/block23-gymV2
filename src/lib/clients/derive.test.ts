import { describe, it, expect } from "vitest";
import {
  deriveClient,
  matchesChip,
  deriveMembershipStatus,
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
