import { describe, it, expect } from "vitest";
import {
  analyticsRange,
  rangeDays,
  dailyTrend,
  byHour,
  byDayOfWeek,
  peakHours,
  peakDays,
  newVsReturning,
  hourLabel,
  type AttRow,
} from "./analytics";

const today = new Date("2026-06-27T00:00:00.000Z"); // Saturday
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const t = (s: string) => new Date(`1970-01-01T${s}:00.000Z`);

const row = (
  clientId: string,
  visitDate: string,
  time: string,
  visitType: "MEMBER" | "WALK_IN" = "MEMBER",
): AttRow => ({ clientId, visitType, visitDate: d(visitDate), timeIn: t(time) });

describe("analyticsRange / rangeDays", () => {
  it("last7 is a 7-day inclusive window", () => {
    const r = analyticsRange("last7", today);
    expect(r.from).toEqual(d("2026-06-21"));
    expect(r.to).toEqual(today);
    expect(rangeDays(r.from, r.to)).toBe(7);
  });
  it("last90 spans 90 days", () => {
    expect(rangeDays(analyticsRange("last90", today).from, today)).toBe(90);
  });
});

describe("dailyTrend", () => {
  it("fills every day and separates total vs unique", () => {
    const rows = [
      row("a", "2026-06-26", "08:00"),
      row("a", "2026-06-26", "18:00"),
      row("b", "2026-06-26", "09:00"),
    ];
    const trend = dailyTrend(rows, d("2026-06-25"), d("2026-06-27"));
    expect(trend).toHaveLength(3);
    expect(trend[0]).toEqual({ date: "2026-06-25", total: 0, unique: 0 });
    expect(trend[1]).toEqual({ date: "2026-06-26", total: 3, unique: 2 });
    expect(trend[2]).toEqual({ date: "2026-06-27", total: 0, unique: 0 });
  });
});

describe("byHour / peakHours", () => {
  it("buckets by UTC hour and finds peaks", () => {
    const rows = [
      row("a", "2026-06-26", "08:30"),
      row("b", "2026-06-26", "08:45"),
      row("c", "2026-06-26", "18:10"),
    ];
    const hours = byHour(rows);
    expect(hours[8].count).toBe(2);
    expect(hours[18].count).toBe(1);
    const peaks = peakHours(hours, 2);
    expect(peaks[0]).toEqual({ hour: 8, count: 2 });
    expect(peaks).toHaveLength(2);
  });
});

describe("byDayOfWeek / peakDays", () => {
  it("averages per weekday over occurrences in range", () => {
    // Two Fridays in range, 3 check-ins on one of them → avg 1.5.
    const rows = [
      row("a", "2026-06-19", "08:00"), // Fri
      row("b", "2026-06-19", "09:00"),
      row("c", "2026-06-19", "10:00"),
    ];
    const dows = byDayOfWeek(rows, d("2026-06-19"), d("2026-06-26")); // includes 2 Fridays
    const fri = dows.find((x) => x.label === "Fri")!;
    expect(fri.total).toBe(3);
    expect(fri.avg).toBe(1.5);
    expect(peakDays(dows, 1)[0]).toEqual({ label: "Fri", total: 3 });
  });
});

describe("newVsReturning", () => {
  it("classifies by first-ever check-in inside the period", () => {
    const rows = [row("a", "2026-06-26", "08:00"), row("b", "2026-06-26", "09:00")];
    const firstEver = new Map([
      ["a", d("2026-06-26")], // new (first in period)
      ["b", d("2026-01-01")], // returning
    ]);
    const r = newVsReturning(rows, firstEver, d("2026-06-21"), today);
    expect(r).toEqual({ newCount: 1, returningCount: 1 });
  });
});

describe("hourLabel", () => {
  it("formats 12-hour labels", () => {
    expect(hourLabel(0)).toBe("12am");
    expect(hourLabel(8)).toBe("8am");
    expect(hourLabel(12)).toBe("12pm");
    expect(hourLabel(18)).toBe("6pm");
  });
});
