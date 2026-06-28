// URL state for the Inventory module (ADR-047). Importable by both server (page,
// views) and client (toolbars/filters) — no "use client". The active `?view=` is
// always preserved so the sub-nav tab survives a filter change.

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export const INVENTORY_PATH = "/inventory";

// ─── Current Stock view ───────────────────────────────────────────────────────

export type StockQuery = { showArchived: boolean };

export function parseStockQuery(sp: RawSearchParams): StockQuery {
  return { showArchived: first(sp.archived) === "1" };
}

export function buildStockHref(patch: Partial<StockQuery>): string {
  const params = new URLSearchParams({ view: "stock" });
  if (patch.showArchived) params.set("archived", "1");
  return `${INVENTORY_PATH}?${params.toString()}`;
}

// ─── Inventory Movement History view ──────────────────────────────────────────

export const MOVEMENT_TYPE_FILTERS = ["all", "PURCHASE", "SALE", "ADJUSTMENT"] as const;
export type MovementTypeFilter = (typeof MOVEMENT_TYPE_FILTERS)[number];

export function isMovementTypeFilter(
  value: string | undefined,
): value is MovementTypeFilter {
  return (
    value !== undefined &&
    (MOVEMENT_TYPE_FILTERS as readonly string[]).includes(value)
  );
}

export type MovementsQuery = {
  preset: string;
  type: MovementTypeFilter;
  productId: string; // "all" or a product id
  from?: string;
  to?: string;
};
