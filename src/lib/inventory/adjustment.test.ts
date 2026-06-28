import { describe, it, expect } from "vitest";
import {
  ADJUSTMENT_REASON_CATEGORIES,
  ADJUSTMENT_REASON_LABELS,
  isAdjustmentReasonCategory,
} from "./adjustment";

describe("isAdjustmentReasonCategory", () => {
  it("accepts every owner-selectable category", () => {
    expect(
      ADJUSTMENT_REASON_CATEGORIES.every((c) => isAdjustmentReasonCategory(c)),
    ).toBe(true);
  });

  it("rejects FORCED_SALE — it is system-only, never owner-selectable (ADR-034)", () => {
    expect(isAdjustmentReasonCategory("FORCED_SALE")).toBe(false);
  });

  it("rejects unknown values and undefined", () => {
    expect(isAdjustmentReasonCategory("damage")).toBe(false);
    expect(isAdjustmentReasonCategory(undefined)).toBe(false);
  });
});

describe("ADJUSTMENT_REASON_LABELS", () => {
  it("has a display label for FORCED_SALE even though it is not selectable", () => {
    expect(ADJUSTMENT_REASON_LABELS.FORCED_SALE).toBe("Forced sale");
  });
});
