import { describe, it, expect } from "vitest";
import { gymDayStartUtc, addDays } from "./dates";

const day = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("gymDayStartUtc", () => {
  it("returns the UTC instant of local midnight for a positive-offset zone", () => {
    // Asia/Manila is UTC+8 (no DST): local 2026-06-27 00:00 = 2026-06-26 16:00 UTC.
    const start = gymDayStartUtc("Asia/Manila", day("2026-06-27"));
    expect(start.toISOString()).toBe("2026-06-26T16:00:00.000Z");
  });

  it("returns the UTC instant of local midnight for a negative-offset zone", () => {
    // America/New_York on 2026-06-27 is EDT (UTC-4): local midnight = 04:00 UTC.
    const start = gymDayStartUtc("America/New_York", day("2026-06-27"));
    expect(start.toISOString()).toBe("2026-06-27T04:00:00.000Z");
  });

  it("a one-day window spans exactly 24h in a no-DST zone", () => {
    const d = day("2026-06-27");
    const start = gymDayStartUtc("Asia/Manila", d);
    const end = gymDayStartUtc("Asia/Manila", addDays(d, 1));
    expect(end.getTime() - start.getTime()).toBe(86_400_000);
  });

  it("UTC zone yields naive midnight unchanged", () => {
    const start = gymDayStartUtc("UTC", day("2026-06-27"));
    expect(start.toISOString()).toBe("2026-06-27T00:00:00.000Z");
  });
});
