// Void reason categories (ADR-028, US-5.3, Flow 11) — structured (not free text) so
// void patterns are aggregable. `OTHER` requires a companion detail note. Mirrors the
// Prisma `VoidReasonCategory` enum; shared by the void action + the void dialog.

export const VOID_REASON_CATEGORIES = [
  "DUPLICATE_ENTRY",
  "WRONG_AMOUNT",
  "WRONG_PRODUCT",
  "CLIENT_CANCELLED",
  "SYSTEM_ERROR",
  "OTHER",
] as const;

export type VoidReasonCategory = (typeof VOID_REASON_CATEGORIES)[number];

export const VOID_REASON_LABELS: Record<VoidReasonCategory, string> = {
  DUPLICATE_ENTRY: "Duplicate entry",
  WRONG_AMOUNT: "Wrong amount",
  WRONG_PRODUCT: "Wrong product",
  CLIENT_CANCELLED: "Client cancelled",
  SYSTEM_ERROR: "System error",
  OTHER: "Other",
};

export function isVoidReasonCategory(
  value: string | undefined,
): value is VoidReasonCategory {
  return (
    value !== undefined &&
    (VOID_REASON_CATEGORIES as readonly string[]).includes(value)
  );
}
