import type { ProductType } from "@/lib/products/types";

// Pure inventory stock math (Module 7, US-7.1/7.6/7.7/7.8, Flow 9). All derived
// figures (days-until-stockout, valuation, shrinkage level) are computed at query
// time from the ledger (ADR-004) — never stored. Kept pure + testable: the caller
// supplies already-aggregated ledger sums.

/**
 * Stock delta for a restock (Flow 9): STANDARD adds units 1:1; SERVING_BASED adds
 * `containers × servings_per_container` servings to `current_stock`.
 */
export function restockDelta(
  productType: ProductType,
  quantityReceived: number,
  servingsPerContainer: number | null,
): number {
  if (productType === "SERVING_BASED_PRODUCT") {
    return quantityReceived * (servingsPerContainer ?? 0);
  }
  return quantityReceived;
}

/**
 * Estimated days until stockout (US-7.6): `current_stock ÷ avg daily sold over the
 * last 30 days`. `soldLast30` is the absolute quantity sold in that window. Returns
 * null when there were no sales (no velocity → "No recent sales data", no div-by-0).
 */
export function daysUntilStockout(
  currentStock: number,
  soldLast30: number,
): number | null {
  if (soldLast30 <= 0) return null;
  const avgDaily = soldLast30 / 30;
  return currentStock / avgDaily;
}

/**
 * Inventory valuation (US-7.7): `Σ current_stock × cost_price` across products whose
 * `cost_price` is set. Products without a cost price are excluded and counted so the
 * owner knows the figure may be understated.
 */
export function inventoryValuation(
  items: { currentStock: number; costPrice: number | null }[],
): { total: number; excludedCount: number } {
  let total = 0;
  let excludedCount = 0;
  for (const i of items) {
    if (i.costPrice === null) {
      excludedCount += 1;
    } else {
      total += i.currentStock * i.costPrice;
    }
  }
  return { total, excludedCount };
}

export type ShrinkageLevel = "none" | "amber" | "red";

/**
 * Shrinkage severity for the Current Stock view (US-7.8). `shrinkage` is the absolute
 * quantity lost to negative ADJUSTMENT entries this month; `salesQtyInPeriod` is the
 * quantity sold in the same period. Any shrinkage is amber; shrinkage exceeding 10% of
 * sales is red. With zero sales the red threshold can't be computed (no div-by-0) — it
 * stays amber until the product has recorded sales in the period.
 */
export function shrinkageLevel(
  shrinkage: number,
  salesQtyInPeriod: number,
): ShrinkageLevel {
  if (shrinkage <= 0) return "none";
  if (salesQtyInPeriod <= 0) return "amber";
  return shrinkage > 0.1 * salesQtyInPeriod ? "red" : "amber";
}
