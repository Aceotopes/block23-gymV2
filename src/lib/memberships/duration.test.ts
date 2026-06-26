import { describe, it, expect } from "vitest";
import {
  durationTypeToDays,
  daysToDurationType,
  isDurationType,
} from "./duration";

describe("durationTypeToDays (ADR-048)", () => {
  it("maps month types to fixed day counts", () => {
    expect(durationTypeToDays("1_MONTH", null)).toBe(30);
    expect(durationTypeToDays("2_MONTHS", null)).toBe(60);
    expect(durationTypeToDays("3_MONTHS", null)).toBe(90);
  });

  it("uses entered days for CUSTOM, null when missing/invalid", () => {
    expect(durationTypeToDays("CUSTOM", 45)).toBe(45);
    expect(durationTypeToDays("CUSTOM", 0)).toBeNull();
    expect(durationTypeToDays("CUSTOM", null)).toBeNull();
  });
});

describe("daysToDurationType", () => {
  it("reverses month day counts, else CUSTOM", () => {
    expect(daysToDurationType(30)).toBe("1_MONTH");
    expect(daysToDurationType(90)).toBe("3_MONTHS");
    expect(daysToDurationType(45)).toBe("CUSTOM");
  });
});

describe("isDurationType", () => {
  it("guards known values", () => {
    expect(isDurationType("1_MONTH")).toBe(true);
    expect(isDurationType("nope")).toBe(false);
  });
});
