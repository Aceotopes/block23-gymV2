import { describe, it, expect } from "vitest";
import {
  classifyClientTransaction,
  revenueBySource,
  dailyRevenueTrend,
  pctChange,
} from "./revenue";

describe("classifyClientTransaction", () => {
  it("classifies a walk-in fee transaction as walk-in", () => {
    expect(classifyClientTransaction(["WALK_IN_FEE"])).toBe("walkin");
  });

  it("classifies a membership transaction as membership", () => {
    expect(classifyClientTransaction(["MEMBERSHIP"])).toBe("membership");
  });
});

describe("revenueBySource", () => {
  it("sums per source and a grand total", () => {
    expect(
      revenueBySource([
        { source: "membership", amount: 1000 },
        { source: "walkin", amount: 75 },
        { source: "product", amount: 250 },
        { source: "membership", amount: 500 },
      ]),
    ).toEqual({ membership: 1500, walkin: 75, product: 250, total: 1825 });
  });

  it("is all-zero for no rows", () => {
    expect(revenueBySource([])).toEqual({
      membership: 0,
      walkin: 0,
      product: 0,
      total: 0,
    });
  });
});

describe("dailyRevenueTrend", () => {
  it("buckets rows into a gap-filled day list", () => {
    const days = ["2026-06-01", "2026-06-02", "2026-06-03"];
    const out = dailyRevenueTrend(
      [
        { day: "2026-06-01", source: "membership", amount: 1000 },
        { day: "2026-06-01", source: "product", amount: 100 },
        { day: "2026-06-03", source: "walkin", amount: 75 },
      ],
      days,
    );
    expect(out).toEqual([
      { date: "2026-06-01", membership: 1000, walkin: 0, product: 100, total: 1100 },
      { date: "2026-06-02", membership: 0, walkin: 0, product: 0, total: 0 },
      { date: "2026-06-03", membership: 0, walkin: 75, product: 0, total: 75 },
    ]);
  });

  it("ignores rows outside the day list", () => {
    const out = dailyRevenueTrend(
      [{ day: "2026-05-31", source: "product", amount: 50 }],
      ["2026-06-01"],
    );
    expect(out).toEqual([
      { date: "2026-06-01", membership: 0, walkin: 0, product: 0, total: 0 },
    ]);
  });
});

describe("pctChange", () => {
  it("computes percent change", () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(80, 100)).toBeCloseTo(-20);
  });

  it("returns null when the prior period is zero", () => {
    expect(pctChange(100, 0)).toBeNull();
  });
});
