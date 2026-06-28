import { describe, it, expect } from "vitest";
import { reportRange, priorRange } from "./period";
import { toDateInputValue } from "@/lib/dates";

const today = new Date("2026-06-15T00:00:00.000Z"); // a Monday

describe("reportRange", () => {
  it("today is a single day", () => {
    const r = reportRange("today", today);
    expect(toDateInputValue(r.from)).toBe("2026-06-15");
    expect(toDateInputValue(r.to)).toBe("2026-06-15");
  });

  it("week starts on Monday", () => {
    const r = reportRange("week", today);
    expect(toDateInputValue(r.from)).toBe("2026-06-15"); // today is Monday
    expect(toDateInputValue(r.to)).toBe("2026-06-15");
  });

  it("month is month-to-date", () => {
    const r = reportRange("month", today);
    expect(toDateInputValue(r.from)).toBe("2026-06-01");
    expect(toDateInputValue(r.to)).toBe("2026-06-15");
  });

  it("year is Jan 1 to today", () => {
    const r = reportRange("year", today);
    expect(toDateInputValue(r.from)).toBe("2026-01-01");
    expect(toDateInputValue(r.to)).toBe("2026-06-15");
  });

  it("custom uses the supplied bounds and corrects inverted ones", () => {
    const a = new Date("2026-06-10T00:00:00.000Z");
    const b = new Date("2026-06-20T00:00:00.000Z");
    expect(toDateInputValue(reportRange("custom", today, b, a).from)).toBe("2026-06-10");
    expect(toDateInputValue(reportRange("custom", today, b, a).to)).toBe("2026-06-20");
  });
});

describe("priorRange", () => {
  it("is the immediately preceding range of equal length", () => {
    const range = {
      from: new Date("2026-06-08T00:00:00.000Z"),
      to: new Date("2026-06-14T00:00:00.000Z"),
    }; // 7 days
    const prior = priorRange(range);
    expect(toDateInputValue(prior.from)).toBe("2026-06-01");
    expect(toDateInputValue(prior.to)).toBe("2026-06-07");
  });

  it("handles a single-day range", () => {
    const range = { from: today, to: today };
    const prior = priorRange(range);
    expect(toDateInputValue(prior.from)).toBe("2026-06-14");
    expect(toDateInputValue(prior.to)).toBe("2026-06-14");
  });
});
