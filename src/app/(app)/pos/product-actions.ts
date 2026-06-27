"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionGymId } from "@/lib/gym";
import {
  productSchema,
  normalizeProduct,
  type ProductFormValues,
} from "./product-schema";

// Product catalog mutations (US-6.1/6.2/6.3, Flow 20). All scoped by the session's
// gymId (ADR-001/025) and re-validated server-side (TECH-STACK rule 10). Archive is a
// soft delete (`deleted_at`, ADR-005) — sales/inventory history is always preserved.
// `current_stock` is never written here: it is ledger-driven (ADR-004) by restocks
// (M7) and sales (M6 Part 2). New products start at 0 until a restock is recorded.

export type ProductActionResult = { ok: true } | { ok: false; error: string };

/** Trim a blank optional string to null (image URL). */
function nullifyBlank(v: string | null): string | null {
  if (v === null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

async function buildData(gymId: string, v: ProductFormValues) {
  // The category must belong to this gym (defends against a stale/forged id).
  const category = await prisma.productCategory.findFirst({
    where: { id: v.categoryId, gymId },
    select: { id: true },
  });
  if (!category) return null;
  const n = normalizeProduct(v);
  return {
    name: n.name,
    categoryId: n.categoryId,
    productType: n.productType,
    sellingPrice: n.sellingPrice,
    costPrice: n.costPrice,
    imageUrl: nullifyBlank(n.imageUrl),
    servingsPerContainer: n.servingsPerContainer,
    containerSellingPrice: n.containerSellingPrice,
    lowStockThreshold: n.lowStockThreshold,
    reorderPoint: n.reorderPoint,
  };
}

export async function createProduct(
  input: ProductFormValues,
): Promise<ProductActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }
  const data = await buildData(gymId, parsed.data);
  if (!data) return { ok: false, error: "Selected category was not found." };

  await prisma.product.create({ data: { gymId, ...data } });

  revalidatePath("/pos");
  return { ok: true };
}

export async function updateProduct(
  id: string,
  input: ProductFormValues,
): Promise<ProductActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }
  const data = await buildData(gymId, parsed.data);
  if (!data) return { ok: false, error: "Selected category was not found." };

  const result = await prisma.product.updateMany({ where: { id, gymId }, data });
  if (result.count === 0) return { ok: false, error: "Product not found." };

  revalidatePath("/pos");
  return { ok: true };
}

export async function archiveProduct(id: string): Promise<ProductActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const result = await prisma.product.updateMany({
    where: { id, gymId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return { ok: false, error: "Product not found or already archived." };

  revalidatePath("/pos");
  return { ok: true };
}

export async function restoreProduct(id: string): Promise<ProductActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const result = await prisma.product.updateMany({
    where: { id, gymId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (result.count === 0) return { ok: false, error: "Product not found." };

  revalidatePath("/pos");
  return { ok: true };
}
