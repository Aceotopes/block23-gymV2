// Payment method — the single source of truth for the Cash / GCash / Card / Other
// options recorded on every CLIENT_TRANSACTION (US-5.1). Mirrors the Prisma
// `PaymentMethod` enum; importable by server (actions, collections) and client
// (membership dialog, walk-in fee dialog, payment filters) — no "use client".

export const PAYMENT_METHODS = ["CASH", "GCASH", "CARD", "OTHER"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  CARD: "Card",
  OTHER: "Other",
};

export function isPaymentMethod(value: string | undefined): value is PaymentMethod {
  return value !== undefined && (PAYMENT_METHODS as readonly string[]).includes(value);
}
