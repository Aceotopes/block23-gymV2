import { describe, it, expect } from "vitest";
import {
  grossProfit,
  costValueInStock,
  parseSlowMovingWindow,
  parseBestSellerSort,
} from "./products";

describe("grossProfit", () => {
  it("computes profit and margin % from revenue and COGS", () => {
    expect(grossProfit(1000, 600)).toEqual({ profit: 400, marginPercent: 40 });
  });

  it("returns null margin when revenue is 0 (no divide-by-zero)", () => {
    expect(grossProfit(0, 0)).toEqual({ profit: 0, marginPercent: null });
  });

  it("allows a negative profit (COGS exceeds revenue)", () => {
    const r = grossProfit(100, 150);
    expect(r.profit).toBe(-50);
    expect(r.marginPercent).toBe(-50);
  });
});

describe("costValueInStock", () => {
  it("multiplies current stock by cost price", () => {
    expect(costValueInStock(20, 35)).toBe(700);
  });

  it("is null when cost price is unset", () => {
    expect(costValueInStock(20, null)).toBeNull();
  });
});

describe("parseSlowMovingWindow", () => {
  it("accepts 30 / 60 / 90", () => {
    expect(parseSlowMovingWindow("60")).toBe(60);
    expect(parseSlowMovingWindow("90")).toBe(90);
  });

  it("defaults to 30 for anything else", () => {
    expect(parseSlowMovingWindow(undefined)).toBe(30);
    expect(parseSlowMovingWindow("45")).toBe(30);
    expect(parseSlowMovingWindow("abc")).toBe(30);
  });
});

describe("parseBestSellerSort", () => {
  it("returns asc only for the explicit asc value", () => {
    expect(parseBestSellerSort("asc")).toBe("asc");
  });

  it("defaults to desc", () => {
    expect(parseBestSellerSort(undefined)).toBe("desc");
    expect(parseBestSellerSort("desc")).toBe("desc");
    expect(parseBestSellerSort("xyz")).toBe("desc");
  });
});
