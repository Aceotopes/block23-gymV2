"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/gym";
import { isPaymentMethod, type PaymentMethod } from "@/lib/payments/method";
import { isVoidReasonCategory, type VoidReasonCategory } from "@/lib/payments/void";
import { lineDescription, type CartMode } from "@/lib/pos/cart";

// POS sale checkout + void (US-6.9/6.10/6.13/6.14, Flows 8/16/11). A POS sale is a
// POS_SALE Transaction with `client_id = null` (ADR-011) and only PRODUCT line items
// (ADR-012). Each line snapshots `unit_price`/`cost_price_snapshot` at checkout
// (ADR-003/026) and creates a SALE inventory entry decrementing `current_stock`
// (ADR-004). Selling below zero is blocked unless `force` is set, which also logs a
// flagged FORCED_SALE adjustment (ADR-009/034). All writes run in one interactive
// transaction so the sale, line items, and ledger commit together.

export type CheckoutLine = {
  productId: string;
  mode: CartMode;
  quantity: number;
};

export type CheckoutInput = {
  lines: CheckoutLine[];
  paymentMethod: PaymentMethod;
  cashReceived?: number | null;
  force?: boolean;
};

export type ForceItem = { name: string; available: number; requested: number };

export type CheckoutResult =
  | { ok: true; total: number }
  | { ok: false; error: string }
  | { ok: false; needsForce: ForceItem[] };

type ResolvedLine = {
  productId: string;
  name: string;
  mode: CartMode;
  quantity: number;
  unitPrice: number;
  costSnapshot: number | null;
  deduction: number; // stock units removed
  description: string;
  subtotal: number;
};

export async function createPosSale(input: CheckoutInput): Promise<CheckoutResult> {
  const ctx = await getSessionContext();
  if (!ctx) return { ok: false, error: "Not authenticated." };

  if (input.lines.length === 0) return { ok: false, error: "The cart is empty." };
  if (!isPaymentMethod(input.paymentMethod)) {
    return { ok: false, error: "Select a payment method." };
  }

  // Load every referenced product (gym-scoped). Archived products are allowed — a
  // product archived mid-transaction still completes (MODULE-SPECS Module 6 edge case).
  const ids = [...new Set(input.lines.map((l) => l.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, gymId: ctx.gymId },
    select: {
      id: true,
      name: true,
      productType: true,
      sellingPrice: true,
      costPrice: true,
      containerSellingPrice: true,
      servingsPerContainer: true,
      currentStock: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  // Resolve each cart line to its snapshot price + stock deduction (server-authoritative).
  const resolved: ResolvedLine[] = [];
  for (const line of input.lines) {
    const p = byId.get(line.productId);
    if (!p) return { ok: false, error: "A product in the cart was not found." };
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      return { ok: false, error: "Quantities must be whole numbers above zero." };
    }

    let unitPrice: number;
    let deduction: number;
    if (line.mode === "standard") {
      if (p.productType !== "STANDARD_PRODUCT") {
        return { ok: false, error: `${p.name} can't be sold as a unit.` };
      }
      unitPrice = Number(p.sellingPrice);
      deduction = line.quantity;
    } else if (line.mode === "serving") {
      if (p.productType !== "SERVING_BASED_PRODUCT") {
        return { ok: false, error: `${p.name} can't be sold per serving.` };
      }
      unitPrice = Number(p.sellingPrice);
      deduction = line.quantity;
    } else {
      // container
      if (p.productType !== "SERVING_BASED_PRODUCT" || p.containerSellingPrice === null) {
        return { ok: false, error: `${p.name} can't be sold per container.` };
      }
      unitPrice = Number(p.containerSellingPrice);
      deduction = line.quantity * (p.servingsPerContainer ?? 0);
    }

    resolved.push({
      productId: p.id,
      name: p.name,
      mode: line.mode,
      quantity: line.quantity,
      unitPrice,
      costSnapshot: p.costPrice === null ? null : Number(p.costPrice),
      deduction,
      description: lineDescription({
        productId: p.id,
        name: p.name,
        mode: line.mode,
        unitPrice,
        quantity: line.quantity,
        servingsPerContainer: p.servingsPerContainer,
      }),
      subtotal: unitPrice * line.quantity,
    });
  }

  // Stock gate (ADR-009): per product, total deduction vs current stock.
  const deductionByProduct = new Map<string, number>();
  for (const r of resolved) {
    deductionByProduct.set(
      r.productId,
      (deductionByProduct.get(r.productId) ?? 0) + r.deduction,
    );
  }
  const needsForce: ForceItem[] = [];
  for (const [pid, total] of deductionByProduct) {
    const p = byId.get(pid)!;
    const available = Number(p.currentStock);
    if (total > available) {
      needsForce.push({ name: p.name, available, requested: total });
    }
  }
  if (needsForce.length > 0 && !input.force) {
    return { ok: false, needsForce };
  }

  const total = resolved.reduce((s, r) => s + r.subtotal, 0);

  // Cash change rule (US-6.13): cash received must cover the total.
  if (input.paymentMethod === "CASH") {
    const cash = input.cashReceived;
    if (cash == null || Number.isNaN(cash) || cash < total) {
      return { ok: false, error: "Cash received must be at least the total." };
    }
  }

  await prisma.$transaction(async (tx) => {
    const sale = await tx.transaction.create({
      data: {
        gymId: ctx.gymId,
        transactionType: "POS_SALE",
        clientId: null,
        transactionDate: new Date(),
        totalAmount: total,
        paymentMethod: input.paymentMethod,
        createdById: ctx.userId,
      },
    });

    // Running stock per product within the transaction.
    const running = new Map<string, number>();
    for (const p of products) running.set(p.id, Number(p.currentStock));

    for (const r of resolved) {
      const li = await tx.transactionLineItem.create({
        data: {
          gymId: ctx.gymId,
          transactionId: sale.id,
          itemType: "PRODUCT",
          referenceProductId: r.productId,
          description: r.description,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          costPriceSnapshot: r.costSnapshot,
          subtotal: r.subtotal,
        },
      });

      const before = running.get(r.productId)!;
      const resulting = before - r.deduction;

      // Canonical per-line SALE entry (MODULE-SPECS Module 6).
      await tx.inventoryTransaction.create({
        data: {
          gymId: ctx.gymId,
          productId: r.productId,
          type: "SALE",
          quantityDelta: -r.deduction,
          resultingStock: resulting,
          referenceTransactionLineItemId: li.id,
        },
      });

      // Force Sale flag (ADR-009/034): a never-silent marker when this line takes
      // stock negative. quantity_delta = 0 — the SALE already moved the stock.
      if (resulting < 0) {
        await tx.inventoryTransaction.create({
          data: {
            gymId: ctx.gymId,
            productId: r.productId,
            type: "ADJUSTMENT",
            quantityDelta: 0,
            resultingStock: resulting,
            adjustmentReasonCategory: "FORCED_SALE",
            referenceTransactionLineItemId: li.id,
            note: `Force sale override — sold ${r.deduction}, stock was ${before}.`,
          },
        });
      }

      running.set(r.productId, resulting);
    }

    for (const [pid, stock] of running) {
      await tx.product.update({ where: { id: pid }, data: { currentStock: stock } });
    }
  });

  revalidatePath("/pos");
  revalidatePath("/payments");
  return { ok: true, total };
}

export type VoidResult = { ok: true } | { ok: false; error: string };

export async function voidPosSale(input: {
  transactionId: string;
  category: string;
  note: string;
}): Promise<VoidResult> {
  const ctx = await getSessionContext();
  if (!ctx) return { ok: false, error: "Not authenticated." };

  if (!isVoidReasonCategory(input.category)) {
    return { ok: false, error: "Select a void reason." };
  }
  const category: VoidReasonCategory = input.category;
  const note = input.note.trim();
  if (input.category === "OTHER" && note.length === 0) {
    return { ok: false, error: "A detail note is required when the reason is Other." };
  }

  const sale = await prisma.transaction.findFirst({
    where: {
      id: input.transactionId,
      gymId: ctx.gymId,
      transactionType: "POS_SALE",
      status: "COMPLETED",
    },
    select: {
      id: true,
      lineItems: {
        select: {
          id: true,
          referenceProductId: true,
          inventoryMovements: { select: { quantityDelta: true } },
        },
      },
    },
  });
  if (!sale) return { ok: false, error: "Sale not found or already voided." };

  // Stock to restore per line = the negative of its recorded ledger movements.
  const restores = sale.lineItems
    .filter((li) => li.referenceProductId !== null)
    .map((li) => ({
      lineItemId: li.id,
      productId: li.referenceProductId!,
      restore: -li.inventoryMovements.reduce(
        (s, m) => s + Number(m.quantityDelta),
        0,
      ),
    }));

  const productIds = [...new Set(restores.map((r) => r.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, gymId: ctx.gymId },
    select: { id: true, currentStock: true },
  });
  const running = new Map(products.map((p) => [p.id, Number(p.currentStock)]));

  await prisma.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: {
        id: sale.id,
        gymId: ctx.gymId,
        transactionType: "POS_SALE",
        status: "COMPLETED",
      },
      data: {
        status: "VOID",
        voidReasonCategory: category,
        voidReasonNote: note.length > 0 ? note.slice(0, 500) : null,
      },
    });

    // Additive reversal (Flow 11): a new ADJUSTMENT per line restores stock; the
    // original SALE rows are preserved. System reversal — no owner reason category.
    for (const r of restores) {
      if (r.restore === 0) continue;
      const before = running.get(r.productId) ?? 0;
      const resulting = before + r.restore;
      await tx.inventoryTransaction.create({
        data: {
          gymId: ctx.gymId,
          productId: r.productId,
          type: "ADJUSTMENT",
          quantityDelta: r.restore,
          resultingStock: resulting,
          referenceTransactionLineItemId: r.lineItemId,
          note: "Void reversal of POS sale.",
        },
      });
      running.set(r.productId, resulting);
    }

    for (const [pid, stock] of running) {
      await tx.product.update({ where: { id: pid }, data: { currentStock: stock } });
    }
  });

  revalidatePath("/pos");
  revalidatePath("/payments");
  return { ok: true };
}
