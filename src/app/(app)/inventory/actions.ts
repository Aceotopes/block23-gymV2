"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionGymId } from "@/lib/gym";
import { restockDelta } from "@/lib/inventory/stock";
import { restockSchema, adjustSchema } from "./inventory-schema";

// Inventory write actions (US-7.1/7.2/7.5, Flows 9/19). Every stock change is a
// discrete InventoryTransaction row and `Product.current_stock` is the cached running
// total (ADR-004) — the two always move together inside one interactive `$transaction`.
// Gym-scoped (ADR-001/025) and re-validated server-side (TECH-STACK rule 10).

export type InventoryActionResult = { ok: true } | { ok: false; error: string };

/**
 * Restock (Flow 9, US-7.1): a PURCHASE ledger entry that RAISES `current_stock`.
 * STANDARD adds units 1:1; SERVING_BASED adds `containers × servings_per_container`
 * servings. Optional total invoice cost is stored on the entry (US-7.5).
 */
export async function restockProduct(
  input: unknown,
): Promise<InventoryActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const parsed = restockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }
  const { productId, quantityReceived, totalRestockCost } = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: productId, gymId },
    select: {
      id: true,
      productType: true,
      servingsPerContainer: true,
      currentStock: true,
    },
  });
  if (!product) return { ok: false, error: "Product not found." };

  const delta = restockDelta(
    product.productType,
    quantityReceived,
    product.servingsPerContainer,
  );
  const resulting = Number(product.currentStock) + delta;

  await prisma.$transaction(async (tx) => {
    await tx.inventoryTransaction.create({
      data: {
        gymId,
        productId: product.id,
        type: "PURCHASE",
        quantityDelta: delta,
        resultingStock: resulting,
        totalRestockCost: totalRestockCost,
      },
    });
    await tx.product.update({
      where: { id: product.id },
      data: { currentStock: resulting },
    });
  });

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { ok: true };
}

/**
 * Manual adjustment (Flow 19, US-7.2): a signed ADJUSTMENT ledger entry with a required
 * owner reason category (FORCED_SALE excluded — ADR-034) and a note required for OTHER
 * (ADR-028). Unlike a Force Sale, a manual decrease that would take stock below zero is
 * BLOCKED — the owner records the actual count, not a negative.
 */
export async function adjustStock(
  input: unknown,
): Promise<InventoryActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) {
    const noteIssue = parsed.error.issues.find((i) => i.path[0] === "note");
    return {
      ok: false,
      error:
        noteIssue?.message ??
        "Please fix the highlighted fields and try again.",
    };
  }
  const { productId, quantityDelta, category, note } = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: productId, gymId },
    select: { id: true, currentStock: true },
  });
  if (!product) return { ok: false, error: "Product not found." };

  const resulting = Number(product.currentStock) + quantityDelta;
  if (resulting < 0) {
    return {
      ok: false,
      error: `Can't reduce below zero — only ${Number(
        product.currentStock,
      )} in stock.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryTransaction.create({
      data: {
        gymId,
        productId: product.id,
        type: "ADJUSTMENT",
        quantityDelta,
        resultingStock: resulting,
        adjustmentReasonCategory: category,
        note: note.length > 0 ? note : null,
      },
    });
    await tx.product.update({
      where: { id: product.id },
      data: { currentStock: resulting },
    });
  });

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { ok: true };
}
