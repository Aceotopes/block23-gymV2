import { describe, it, expect } from "vitest";
import { presetRange } from "./history";
import { summarizeToday, ordinalVisit, type TodayRow } from "./today";
import {
  deriveClient,
  deriveCheckInBranch,
  activeMembershipId,
  type MembershipForDerivation,
} from "@/lib/clients/derive";

const today = new Date("2026-06-27T00:00:00.000Z");
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const t = (s: string) => new Date(`1970-01-01T${s}:00.000Z`);

describe("presetRange", () => {
  it("today / yesterday are single days", () => {
    expect(presetRange("today", today)).toEqual({ from: today, to: today });
    expect(presetRange("yesterday", today)).toEqual({
      from: d("2026-06-26"),
      to: d("2026-06-26"),
    });
  });
  it("last7 / last30 are inclusive windows ending today", () => {
    expect(presetRange("last7", today).from).toEqual(d("2026-06-21"));
    expect(presetRange("last30", today).from).toEqual(d("2026-05-29"));
  });
  it("custom uses bounds and repairs inverted ranges", () => {
    expect(presetRange("custom", today, d("2026-06-01"), d("2026-06-10"))).toEqual(
      { from: d("2026-06-01"), to: d("2026-06-10") },
    );
    expect(presetRange("custom", today, d("2026-06-10"), d("2026-06-01"))).toEqual(
      { from: d("2026-06-01"), to: d("2026-06-10") },
    );
  });
});

describe("summarizeToday", () => {
  const rows: TodayRow[] = [
    { id: "1", clientId: "a", clientName: "A", visitType: "MEMBER", timeIn: t("08:00"), updatedAt: null },
    { id: "2", clientId: "b", clientName: "B", visitType: "WALK_IN", timeIn: t("09:00"), updatedAt: null },
    { id: "3", clientId: "a", clientName: "A", visitType: "MEMBER", timeIn: t("18:00"), updatedAt: null },
  ];

  it("counts total vs unique and numbers repeat visits", () => {
    const s = summarizeToday(rows);
    expect(s.total).toBe(3);
    expect(s.unique).toBe(2);
    // reverse-chronological
    expect(s.rows.map((r) => r.id)).toEqual(["3", "2", "1"]);
    const aSecond = s.rows.find((r) => r.id === "3")!;
    expect(aSecond.visitNumber).toBe(2);
    const aFirst = s.rows.find((r) => r.id === "1")!;
    expect(aFirst.visitNumber).toBe(1);
  });

  it("ordinalVisit labels", () => {
    expect(ordinalVisit(1)).toBe("1st visit");
    expect(ordinalVisit(2)).toBe("2nd visit");
    expect(ordinalVisit(4)).toBe("4th visit");
  });
});

describe("deriveCheckInBranch + activeMembershipId", () => {
  const thresholds = {
    expirationWarningDays: 7,
    walkinInactivityThresholdDays: 7,
    memberInactivityWarningDays: 14,
  };
  const branch = (memberships: MembershipForDerivation[]) =>
    deriveCheckInBranch(
      deriveClient({ memberships, lastVisitDate: null, totalVisits: 0, today, thresholds }),
    );

  it("active in-effect → active-member", () => {
    expect(branch([{ startDate: d("2026-06-01"), endDate: d("2026-07-26"), cancelledAt: null }])).toBe(
      "active-member",
    );
  });
  it("only upcoming → upcoming-member", () => {
    expect(branch([{ startDate: d("2026-07-01"), endDate: d("2026-08-01"), cancelledAt: null }])).toBe(
      "upcoming-member",
    );
  });
  it("expired member → expired-member", () => {
    expect(branch([{ startDate: d("2026-01-01"), endDate: d("2026-02-01"), cancelledAt: null }])).toBe(
      "expired-member",
    );
  });
  it("no membership → walk-in", () => {
    expect(branch([])).toBe("walk-in");
  });

  it("activeMembershipId picks the furthest-ending in-effect membership", () => {
    const rows = [
      { id: "m1", startDate: d("2026-06-01"), endDate: d("2026-07-01"), cancelledAt: null },
      { id: "m2", startDate: d("2026-06-15"), endDate: d("2026-07-26"), cancelledAt: null },
      { id: "m3", startDate: d("2026-07-27"), endDate: d("2026-08-27"), cancelledAt: null }, // upcoming
    ];
    expect(activeMembershipId(rows, today)).toBe("m2");
  });
  it("activeMembershipId is null when none in effect", () => {
    expect(
      activeMembershipId(
        [{ id: "m1", startDate: d("2026-01-01"), endDate: d("2026-02-01"), cancelledAt: null }],
        today,
      ),
    ).toBeNull();
  });
});
