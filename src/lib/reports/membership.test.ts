import { describe, it, expect } from "vitest";
import { isRenewal, renewalRate, monthBuckets } from "./membership";
import { toDateInputValue } from "@/lib/dates";

describe("isRenewal", () => {
  it("is a renewal when chained off a prior membership", () => {
    expect(isRenewal({ renewedFromMembershipId: "abc" })).toBe(true);
    expect(isRenewal({ renewedFromMembershipId: null })).toBe(false);
  });
});

describe("renewalRate", () => {
  it("is the renewal share of memberships sold", () => {
    expect(renewalRate(3, 1)).toBe(25);
    expect(renewalRate(0, 4)).toBe(100);
  });

  it("is null when nothing was sold", () => {
    expect(renewalRate(0, 0)).toBeNull();
  });
});

describe("monthBuckets", () => {
  it("enumerates whole calendar months across the range", () => {
    const from = new Date("2026-01-15T00:00:00.000Z");
    const to = new Date("2026-03-02T00:00:00.000Z");
    const b = monthBuckets(from, to);
    expect(b.map((x) => x.key)).toEqual(["2026-01", "2026-02", "2026-03"]);
    // Months are not clipped to the partial first/last month.
    expect(toDateInputValue(b[0].from)).toBe("2026-01-01");
    expect(toDateInputValue(b[0].to)).toBe("2026-01-31");
    expect(toDateInputValue(b[2].from)).toBe("2026-03-01");
    expect(toDateInputValue(b[2].to)).toBe("2026-03-31");
  });

  it("spans a year boundary and labels each month", () => {
    const b = monthBuckets(
      new Date("2025-12-01T00:00:00.000Z"),
      new Date("2026-01-31T00:00:00.000Z"),
    );
    expect(b.map((x) => x.key)).toEqual(["2025-12", "2026-01"]);
    expect(b[0].label).toBe("Dec 2025");
    expect(b[1].label).toBe("Jan 2026");
  });

  it("returns a single bucket for a within-month range", () => {
    const day = new Date("2026-06-15T00:00:00.000Z");
    const b = monthBuckets(day, day);
    expect(b).toHaveLength(1);
    expect(b[0].key).toBe("2026-06");
  });
});
