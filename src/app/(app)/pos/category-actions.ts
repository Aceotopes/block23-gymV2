"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionGymId } from "@/lib/gym";

// Product category mutations (US-6.5, Flow 20). Gym-scoped (ADR-001/025). Categories
// are create + rename only at MVP — no delete (products reference them; MODULE-SPECS
// Module 6). Duplicate names within a gym are blocked (case-insensitive).

export type CategoryActionResult = { ok: true } | { ok: false; error: string };

function clean(name: string): string {
  return name.trim();
}

async function nameTaken(
  gymId: string,
  name: string,
  excludeId?: string,
): Promise<boolean> {
  const existing = await prisma.productCategory.findFirst({
    where: {
      gymId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
}

export async function createCategory(name: string): Promise<CategoryActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const n = clean(name);
  if (n.length === 0) return { ok: false, error: "A category name is required." };
  if (n.length > 60) return { ok: false, error: "Category name is too long." };
  if (await nameTaken(gymId, n)) {
    return { ok: false, error: "A category with that name already exists." };
  }

  await prisma.productCategory.create({ data: { gymId, name: n } });
  revalidatePath("/pos");
  return { ok: true };
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<CategoryActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const n = clean(name);
  if (n.length === 0) return { ok: false, error: "A category name is required." };
  if (n.length > 60) return { ok: false, error: "Category name is too long." };
  if (await nameTaken(gymId, n, id)) {
    return { ok: false, error: "A category with that name already exists." };
  }

  const result = await prisma.productCategory.updateMany({
    where: { id, gymId },
    data: { name: n },
  });
  if (result.count === 0) return { ok: false, error: "Category not found." };

  revalidatePath("/pos");
  return { ok: true };
}
