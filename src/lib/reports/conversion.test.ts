import { describe, it, expect } from "vitest";
import { deriveConversion } from "./conversion";

const date = (s: string) => new Date(`${s}T00:00:00.000Z`);
const instant = (s: string) => new Date(s);

describe("deriveConversion (ADR-020)", () => {
  it("is not converted with no membership", () => {
    const c = deriveConversion({
      earliestMembershipCreatedAt: null,
      walkInVisitDates: [date("2026-05-01")],
    });
    expect(c.converted).toBe(false);
    expect(c.walkInsBeforeConversion).toBe(0);
  });

  it("is not converted when no walk-in predates the membership", () => {
    const c = deriveConversion({
      earliestMembershipCreatedAt: instant("2026-05-01T10:00:00.000Z"),
      walkInVisitDates: [date("2026-05-10")], // after conversion
    });
    expect(c.converted).toBe(false);
  });

  it("counts only walk-ins before conversion and measures days from the first", () => {
    const c = deriveConversion({
      earliestMembershipCreatedAt: instant("2026-05-20T14:30:00.000Z"),
      walkInVisitDates: [
        date("2026-05-01"),
        date("2026-05-08"),
        date("2026-05-25"), // after conversion — excluded
      ],
    });
    expect(c.converted).toBe(true);
    expect(c.walkInsBeforeConversion).toBe(2);
    expect(c.firstWalkInDate?.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(c.daysToConvert).toBe(19); // May 1 → May 20
  });

  it("treats a same-day walk-in (midnight) as predating a later membership instant", () => {
    const c = deriveConversion({
      earliestMembershipCreatedAt: instant("2026-05-20T14:30:00.000Z"),
      walkInVisitDates: [date("2026-05-20")],
    });
    expect(c.converted).toBe(true);
    expect(c.walkInsBeforeConversion).toBe(1);
    expect(c.daysToConvert).toBe(0);
  });
});
