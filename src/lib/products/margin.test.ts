import { describe, it, expect } from "vitest";
import { grossMargin } from "./margin";
import { isProductType, PRODUCT_TYPES } from "./types";

describe("grossMargin", () => {
  it("returns null when cost price is unset", () => {
    expect(grossMargin(100, null)).toBeNull();
  });

  it("computes amount and percent when both are set", () => {
    expect(grossMargin(100, 60)).toEqual({ amount: 40, percent: 40 });
  });

  it("handles a negative margin (cost above price)", () => {
    expect(grossMargin(50, 80)).toEqual({ amount: -30, percent: -60 });
  });

  it("leaves percent null for a ₱0 selling price (no divide-by-zero)", () => {
    expect(grossMargin(0, 0)).toEqual({ amount: 0, percent: null });
  });

  it("returns null when the selling price is NaN (empty field)", () => {
    expect(grossMargin(Number.NaN, 60)).toBeNull();
  });
});

describe("isProductType", () => {
  it("accepts only the two product types", () => {
    expect(PRODUCT_TYPES.every((t) => isProductType(t))).toBe(true);
    expect(isProductType("standard")).toBe(false);
    expect(isProductType(undefined)).toBe(false);
  });
});
