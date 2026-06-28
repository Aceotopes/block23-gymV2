// Inventory ledger vocabulary (Module 7, Flow 19, ADR-028/034). Manual-adjustment
// reason categories are structured (not free text) so shrinkage-by-cause is
// aggregable. `OTHER` requires a companion detail note.
//
// FORCED_SALE is a system-only category, auto-assigned on Force Sale overrides (M6,
// ADR-034) — it is NEVER owner-selectable, so it is excluded from the selector list
// below. It is still present in the display label map for rendering it in the
// Inventory Movement History.

export const ADJUSTMENT_REASON_CATEGORIES = [
  "DAMAGE",
  "EXPIRY",
  "THEFT",
  "COUNT_CORRECTION",
  "NATURAL_WASTAGE",
  "PROMOTION",
  "OTHER",
] as const;

export type AdjustmentReasonCategory = (typeof ADJUSTMENT_REASON_CATEGORIES)[number];

export function isAdjustmentReasonCategory(
  value: string | undefined,
): value is AdjustmentReasonCategory {
  return (
    value !== undefined &&
    (ADJUSTMENT_REASON_CATEGORIES as readonly string[]).includes(value)
  );
}

// Display labels for every category in the Prisma enum — including the system-only
// FORCED_SALE, which the movement history must still be able to render (ADR-034).
export const ADJUSTMENT_REASON_LABELS: Record<
  AdjustmentReasonCategory | "FORCED_SALE",
  string
> = {
  DAMAGE: "Damage",
  EXPIRY: "Expiry",
  THEFT: "Theft",
  COUNT_CORRECTION: "Count correction",
  NATURAL_WASTAGE: "Natural wastage",
  PROMOTION: "Promotion",
  OTHER: "Other",
  FORCED_SALE: "Forced sale",
};

// Inventory movement (ledger) types — mirrors the Prisma `InventoryTransactionType`.
export const MOVEMENT_TYPE_LABELS = {
  PURCHASE: "Restock",
  SALE: "Sale",
  ADJUSTMENT: "Adjustment",
} as const;

export type MovementType = keyof typeof MOVEMENT_TYPE_LABELS;
