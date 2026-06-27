"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import {
  isVoidReasonCategory,
  type VoidReasonCategory,
} from "@/lib/payments/void";

// Void a client payment (US-5.3, Flow 11). Voiding is ADDITIVE and structured: it
// sets status=VOID + a required `void_reason_category` (ADR-028) + an optional note
// (required when category=OTHER) and changes nothing else. The record is preserved
// and excluded from revenue totals (the collections/history queries filter VOID).
// Voiding NEVER cancels the associated membership (ADR-041) and NEVER deletes the
// attendance record (MODULE-SPECS Module 5 edge case) — those are separate actions.

export type VoidResult = { ok: true } | { ok: false; error: string };

export async function voidClientTransaction(input: {
  transactionId: string;
  category: string;
  note: string;
}): Promise<VoidResult> {
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  if (!isVoidReasonCategory(input.category)) {
    return { ok: false, error: "Select a void reason." };
  }
  const category: VoidReasonCategory = input.category;
  const note = input.note.trim();
  if (category === "OTHER" && note.length === 0) {
    return { ok: false, error: "A detail note is required when the reason is Other." };
  }

  // Only a COMPLETED, gym-scoped client transaction can be voided (idempotent guard).
  const result = await prisma.transaction.updateMany({
    where: {
      id: input.transactionId,
      gymId: gym.id,
      transactionType: "CLIENT_TRANSACTION",
      status: "COMPLETED",
    },
    data: {
      status: "VOID",
      voidReasonCategory: category,
      voidReasonNote: note.length > 0 ? note.slice(0, 500) : null,
    },
  });
  if (result.count === 0) {
    return { ok: false, error: "Transaction not found or already voided." };
  }

  revalidatePath("/payments");
  revalidatePath("/clients");
  return { ok: true };
}
