import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "./method";

// End-of-day collections aggregation (US-5.4, Flow 17). Pure + testable: the caller
// supplies the day's non-voided transactions (spanning CLIENT_TRANSACTION and, once
// Module 6 lands, POS_SALE — ADR-006) already scoped + filtered; this groups them by
// payment method into a fixed Cash/GCash/Card/Other order plus a grand total.

export type CollectionRow = { paymentMethod: PaymentMethod; totalAmount: number };

export type CollectionLine = {
  method: PaymentMethod;
  label: string;
  count: number;
  total: number;
};

export type CollectionsSummary = {
  lines: CollectionLine[]; // always all four methods, in canonical order
  grandCount: number;
  grandTotal: number;
};

export function summarizeCollections(rows: CollectionRow[]): CollectionsSummary {
  const counts = new Map<PaymentMethod, { count: number; total: number }>();
  for (const m of PAYMENT_METHODS) counts.set(m, { count: 0, total: 0 });

  for (const r of rows) {
    const bucket = counts.get(r.paymentMethod);
    if (!bucket) continue; // ignore unknown methods defensively
    bucket.count += 1;
    bucket.total += r.totalAmount;
  }

  const lines: CollectionLine[] = PAYMENT_METHODS.map((method) => {
    const b = counts.get(method)!;
    return {
      method,
      label: PAYMENT_METHOD_LABELS[method],
      count: b.count,
      total: b.total,
    };
  });

  return {
    lines,
    grandCount: lines.reduce((s, l) => s + l.count, 0),
    grandTotal: lines.reduce((s, l) => s + l.total, 0),
  };
}
