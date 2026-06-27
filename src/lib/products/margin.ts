// Gross margin — pure, derived, never stored (US-6.15). The product form shows it
// live as selling/cost price change; reports recompute from the cost snapshot. Margin
// % is only defined when selling_price > 0 (avoids divide-by-zero on free/₱0 items).

export type GrossMargin = { amount: number; percent: number | null };

/**
 * Gross margin for a product. Returns null when `costPrice` is unset (the form shows
 * "— (no cost price set)"). `percent` is null when `sellingPrice` is 0 or NaN.
 */
export function grossMargin(
  sellingPrice: number,
  costPrice: number | null,
): GrossMargin | null {
  if (costPrice === null || Number.isNaN(costPrice)) return null;
  if (Number.isNaN(sellingPrice)) return null;
  const amount = sellingPrice - costPrice;
  const percent = sellingPrice > 0 ? (amount / sellingPrice) * 100 : null;
  return { amount, percent };
}
