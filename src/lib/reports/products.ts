// Pure product/inventory report helpers (Module 8 — US-8.7/8.9/8.12/8.18/8.21). No DB
// or session access; callers pass already-fetched + aggregated rows. "Units / servings
// sold" is always taken from the SALE inventory ledger (stock units — servings for
// serving-based), so a container-mode sale counts consistently with stock movements.
// Revenue uses the line-item subtotal (price snapshot, ADR-003); COGS uses
// `cost_price_snapshot` per stock unit (ADR-026) — never the live cost price.

/**
 * Gross profit and gross margin % from aggregate revenue and COGS (US-8.12).
 * `marginPercent` is null when `revenue` is 0 or negative (no divide-by-zero; the
 * report renders "—"), so a period with no product revenue never shows a bogus margin.
 */
export function grossProfit(
  revenue: number,
  cogs: number,
): { profit: number; marginPercent: number | null } {
  const profit = revenue - cogs;
  const marginPercent = revenue > 0 ? (profit / revenue) * 100 : null;
  return { profit, marginPercent };
}

/**
 * Cost value locked in stock (US-8.21): `current_stock × cost_price`. Null when
 * `cost_price` is unset — the report shows "—" and excludes it from cost-value totals.
 */
export function costValueInStock(
  currentStock: number,
  costPrice: number | null,
): number | null {
  if (costPrice === null) return null;
  return currentStock * costPrice;
}

// Slow-moving / dead stock lookback window (US-8.21): 30 (default) / 60 / 90 days.
export const SLOW_MOVING_WINDOWS = [30, 60, 90] as const;
export type SlowMovingWindow = (typeof SLOW_MOVING_WINDOWS)[number];

export function parseSlowMovingWindow(value: string | undefined): SlowMovingWindow {
  const n = Number(value);
  return (SLOW_MOVING_WINDOWS as readonly number[]).includes(n)
    ? (n as SlowMovingWindow)
    : 30;
}

// Best-sellers sort direction (US-8.7): descending (top sellers) by default, ascending
// secondary sort to surface the lowest-performing items / dead-stock candidates.
export type BestSellerSort = "desc" | "asc";

export function parseBestSellerSort(value: string | undefined): BestSellerSort {
  return value === "asc" ? "asc" : "desc";
}
