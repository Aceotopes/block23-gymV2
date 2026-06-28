// Revenue classification + aggregation (US-8.1/8.2, ADR-006/024). All revenue lives
// in the unified `Transaction` ledger; a transaction's *source* is derived: a POS_SALE
// is always Product, and a CLIENT_TRANSACTION is Membership or Walk-in by its line item
// type (the two are never mixed — ADR-024). Pure + testable: callers pass already-
// scoped, non-voided rows. Shared by the Dashboard and the M8 revenue reports.

export const REVENUE_SOURCES = ["membership", "walkin", "product"] as const;
export type RevenueSource = (typeof REVENUE_SOURCES)[number];

export const REVENUE_SOURCE_LABELS: Record<RevenueSource, string> = {
  membership: "Membership",
  walkin: "Walk-in",
  product: "Product",
};

export type ItemType = "MEMBERSHIP" | "WALK_IN_FEE" | "PRODUCT";

/**
 * Source of a CLIENT_TRANSACTION from its line item types. Membership and walk-in fees
 * are never mixed in one client transaction (ADR-024), so the presence of a WALK_IN_FEE
 * item classifies it as a walk-in; otherwise it is a membership payment.
 */
export function classifyClientTransaction(itemTypes: ItemType[]): RevenueSource {
  return itemTypes.includes("WALK_IN_FEE") ? "walkin" : "membership";
}

export type RevenueRow = { source: RevenueSource; amount: number };

export type RevenueBySource = Record<RevenueSource, number> & { total: number };

export function revenueBySource(rows: RevenueRow[]): RevenueBySource {
  const out: RevenueBySource = {
    membership: 0,
    walkin: 0,
    product: 0,
    total: 0,
  };
  for (const r of rows) {
    out[r.source] += r.amount;
    out.total += r.amount;
  }
  return out;
}

export type DailyRevenueRow = { day: string; source: RevenueSource; amount: number };
export type RevenueTrendPoint = {
  date: string;
  membership: number;
  walkin: number;
  product: number;
  total: number;
};

/**
 * Daily revenue split by source over an explicit, gap-filled list of `YYYY-MM-DD`
 * days (so missing days render as zero, not holes — same approach as the attendance
 * trend). `day` on each row is the transaction's gym-local calendar day.
 */
export function dailyRevenueTrend(
  rows: DailyRevenueRow[],
  days: string[],
): RevenueTrendPoint[] {
  const map = new Map<string, RevenueTrendPoint>();
  for (const d of days) {
    map.set(d, { date: d, membership: 0, walkin: 0, product: 0, total: 0 });
  }
  for (const r of rows) {
    const p = map.get(r.day);
    if (!p) continue;
    p[r.source] += r.amount;
    p.total += r.amount;
  }
  return days.map((d) => map.get(d)!);
}

/** Percent change current vs prior; null when prior is 0 (renders as "N/A"). */
export function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return ((current - prior) / prior) * 100;
}
