// Pure POS cart math (US-6.6–6.9, 6.13, 6.14). No DB, no React — used by the cart
// store, the checkout dialog, and (the deduction logic) mirrored server-side. Prices
// here are for display; the server re-snapshots unit/cost price at checkout (ADR-003).

export type CartMode = "standard" | "serving" | "container";

export type CartLine = {
  productId: string;
  name: string;
  mode: CartMode;
  unitPrice: number; // selling_price (standard/serving) or container_selling_price
  quantity: number; // units / servings / containers
  servingsPerContainer: number | null; // container mode only — for stock deduction
};

/** Stable cart key — a product may appear once per mode (e.g. serving + container). */
export function cartKey(productId: string, mode: CartMode): string {
  return `${productId}:${mode}`;
}

export function lineSubtotal(line: CartLine): number {
  return line.unitPrice * line.quantity;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineSubtotal(l), 0);
}

/**
 * Stock units this line removes from `current_stock`. Container mode deducts
 * `quantity × servings_per_container` (ADR-027); all other modes deduct `quantity`.
 */
export function stockDeduction(line: CartLine): number {
  if (line.mode === "container") {
    return line.quantity * (line.servingsPerContainer ?? 0);
  }
  return line.quantity;
}

export function changeDue(cashReceived: number, total: number): number {
  return cashReceived - total;
}

/** Human-readable line description snapshot (DOMAIN-MODEL TransactionLineItem). */
export function lineDescription(line: CartLine): string {
  if (line.mode === "container") {
    const servings = line.quantity * (line.servingsPerContainer ?? 0);
    return `${line.name} — ${line.quantity} container${
      line.quantity === 1 ? "" : "s"
    } (${servings} servings)`;
  }
  if (line.mode === "serving") {
    return `${line.name} — ${line.quantity} serving${line.quantity === 1 ? "" : "s"}`;
  }
  return `${line.name} — ${line.quantity} unit${line.quantity === 1 ? "" : "s"}`;
}
