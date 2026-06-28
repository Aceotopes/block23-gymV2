import { describe, it, expect } from "vitest";
import {
  restockDelta,
  daysUntilStockout,
  inventoryValuation,
  shrinkageLevel,
} from "./stock";

describe("restockDelta", () => {
  it("adds units 1:1 for a standard product", () => {
    expect(restockDelta("STANDARD_PRODUCT", 24, null)).toBe(24);
  });

  it("multiplies containers by servings_per_container for a serving-based product", () => {
    expect(restockDelta("SERVING_BASED_PRODUCT", 2, 70)).toBe(140);
  });

  it("treats a missing servings_per_container as zero (defensive)", () => {
    expect(restockDelta("SERVING_BASED_PRODUCT", 3, null)).toBe(0);
  });
});

describe("daysUntilStockout", () => {
  it("returns null when there were no sales in the window", () => {
    expect(daysUntilStockout(100, 0)).toBeNull();
  });

  it("estimates days from average daily velocity", () => {
    // sold 30 in 30 days = 1/day; 50 in stock → 50 days.
    expect(daysUntilStockout(50, 30)).toBe(50);
  });

  it("returns 0 when stock is already empty", () => {
    expect(daysUntilStockout(0, 30)).toBe(0);
  });
});

describe("inventoryValuation", () => {
  it("sums current_stock × cost_price and excludes null-cost products", () => {
    expect(
      inventoryValuation([
        { currentStock: 10, costPrice: 5 },
        { currentStock: 4, costPrice: 25 },
        { currentStock: 8, costPrice: null },
      ]),
    ).toEqual({ total: 150, excludedCount: 1 });
  });

  it("is zero with no priced products", () => {
    expect(inventoryValuation([{ currentStock: 3, costPrice: null }])).toEqual({
      total: 0,
      excludedCount: 1,
    });
  });
});

describe("shrinkageLevel", () => {
  it("is none with no shrinkage", () => {
    expect(shrinkageLevel(0, 100)).toBe("none");
  });

  it("is amber for any shrinkage within 10% of sales", () => {
    expect(shrinkageLevel(5, 100)).toBe("amber");
  });

  it("is red when shrinkage exceeds 10% of sales", () => {
    expect(shrinkageLevel(11, 100)).toBe("red");
  });

  it("stays amber (not red) when there are zero sales — no divide-by-zero", () => {
    expect(shrinkageLevel(11, 0)).toBe("amber");
  });
});
