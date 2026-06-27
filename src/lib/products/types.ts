// Product type — the single source of truth for STANDARD_PRODUCT vs
// SERVING_BASED_PRODUCT (mirrors the Prisma `ProductType` enum). STANDARD is sold per
// unit (bottled water); SERVING_BASED tracks remaining servings/scoops (protein tub),
// and may carry a container_selling_price to enable Per Container POS mode (ADR-027).
// Importable by server (actions) and client (product form) — no "use client".

export const PRODUCT_TYPES = ["STANDARD_PRODUCT", "SERVING_BASED_PRODUCT"] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  STANDARD_PRODUCT: "Standard (per unit)",
  SERVING_BASED_PRODUCT: "Serving-based (per scoop)",
};

export function isProductType(value: string | undefined): value is ProductType {
  return value !== undefined && (PRODUCT_TYPES as readonly string[]).includes(value);
}
