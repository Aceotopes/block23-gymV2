// URL state for the Product Management list (ADR-047). Importable by both server
// (page, table) and client (toolbar) — no "use client". Keeps `view=products` so the
// POS sub-nav tab is preserved across filter changes.

export type ProductsQuery = {
  q: string;
  showArchived: boolean;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseProductsQuery(sp: RawSearchParams): ProductsQuery {
  return {
    q: (first(sp.q) ?? "").trim(),
    showArchived: first(sp.archived) === "1",
  };
}

export const POS_PATH = "/pos";

export function buildProductsHref(
  current: ProductsQuery,
  patch: Partial<ProductsQuery>,
): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams({ view: "products" });
  if (next.q) params.set("q", next.q);
  if (next.showArchived) params.set("archived", "1");
  return `${POS_PATH}?${params.toString()}`;
}
