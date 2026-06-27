import { describe, it, expect } from "vitest";
import { summarizeCollections } from "./collections";
import { isPaymentMethod, PAYMENT_METHODS } from "./method";
import { isVoidReasonCategory } from "./void";

describe("summarizeCollections", () => {
  it("always returns all four methods in canonical order, even when empty", () => {
    const s = summarizeCollections([]);
    expect(s.lines.map((l) => l.method)).toEqual([
      "CASH",
      "GCASH",
      "CARD",
      "OTHER",
    ]);
    expect(s.lines.every((l) => l.count === 0 && l.total === 0)).toBe(true);
    expect(s.grandCount).toBe(0);
    expect(s.grandTotal).toBe(0);
  });

  it("groups counts and totals per method", () => {
    const s = summarizeCollections([
      { paymentMethod: "CASH", totalAmount: 100 },
      { paymentMethod: "CASH", totalAmount: 50 },
      { paymentMethod: "GCASH", totalAmount: 200 },
      { paymentMethod: "OTHER", totalAmount: 25 },
    ]);
    const byMethod = Object.fromEntries(s.lines.map((l) => [l.method, l]));
    expect(byMethod.CASH).toMatchObject({ count: 2, total: 150 });
    expect(byMethod.GCASH).toMatchObject({ count: 1, total: 200 });
    expect(byMethod.CARD).toMatchObject({ count: 0, total: 0 });
    expect(byMethod.OTHER).toMatchObject({ count: 1, total: 25 });
  });

  it("computes the grand total across methods", () => {
    const s = summarizeCollections([
      { paymentMethod: "CASH", totalAmount: 100 },
      { paymentMethod: "CARD", totalAmount: 300 },
      { paymentMethod: "GCASH", totalAmount: 200 },
    ]);
    expect(s.grandCount).toBe(3);
    expect(s.grandTotal).toBe(600);
  });
});

describe("enum guards", () => {
  it("isPaymentMethod accepts only the four methods", () => {
    expect(PAYMENT_METHODS.every((m) => isPaymentMethod(m))).toBe(true);
    expect(isPaymentMethod("cash")).toBe(false);
    expect(isPaymentMethod(undefined)).toBe(false);
    expect(isPaymentMethod("VENMO")).toBe(false);
  });

  it("isVoidReasonCategory accepts only the structured categories", () => {
    expect(isVoidReasonCategory("OTHER")).toBe(true);
    expect(isVoidReasonCategory("DUPLICATE_ENTRY")).toBe(true);
    expect(isVoidReasonCategory("REFUND")).toBe(false);
    expect(isVoidReasonCategory(undefined)).toBe(false);
  });
});
