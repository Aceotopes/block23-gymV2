"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionGymId } from "@/lib/gym";
import { durationTypeToDays } from "@/lib/memberships/duration";
import { planSchema, type PlanFormValues } from "./plan-schema";

export type PlanActionResult = { ok: true } | { ok: false; error: string };

// Membership Plan catalog mutations (US-3.9, Flow 13). All scoped by the session's
// gymId (ADR-001/025) and re-validated server-side (TECH-STACK rule 10). Editing a
// plan's default price never rewrites past `price_paid` snapshots (ADR-003) — those
// are copied onto each Membership at purchase time. Retirement is `is_active=false`,
// not a delete (ADR-005 note / DOMAIN-MODEL) — existing memberships are unaffected.

function resolveDays(v: PlanFormValues): number | null {
  return durationTypeToDays(v.durationType, v.customDays);
}

export async function createPlan(
  input: PlanFormValues,
): Promise<PlanActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }
  const v = parsed.data;
  const durationDays = resolveDays(v);
  if (durationDays === null) {
    return { ok: false, error: "Enter a valid duration." };
  }

  await prisma.membershipPlan.create({
    data: {
      gymId,
      name: v.name,
      durationDays,
      defaultPrice: v.defaultPrice,
      isActive: v.isActive,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function updatePlan(
  id: string,
  input: PlanFormValues,
): Promise<PlanActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }
  const v = parsed.data;
  const durationDays = resolveDays(v);
  if (durationDays === null) {
    return { ok: false, error: "Enter a valid duration." };
  }

  // If this edit deactivates the last active plan, block it (Flow 13).
  if (!v.isActive) {
    const blocked = await wouldLeaveNoActivePlan(gymId, id);
    if (blocked) {
      return { ok: false, error: "At least one active plan is required." };
    }
  }

  const result = await prisma.membershipPlan.updateMany({
    where: { id, gymId },
    data: {
      name: v.name,
      durationDays,
      defaultPrice: v.defaultPrice,
      isActive: v.isActive,
    },
  });
  if (result.count === 0) return { ok: false, error: "Plan not found." };

  revalidatePath("/settings");
  return { ok: true };
}

export async function retirePlan(id: string): Promise<PlanActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  // At least one active plan must remain (Flow 13).
  if (await wouldLeaveNoActivePlan(gymId, id)) {
    return { ok: false, error: "At least one active plan is required." };
  }

  const result = await prisma.membershipPlan.updateMany({
    where: { id, gymId },
    data: { isActive: false },
  });
  if (result.count === 0) return { ok: false, error: "Plan not found." };

  revalidatePath("/settings");
  return { ok: true };
}

export async function reactivatePlan(id: string): Promise<PlanActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const result = await prisma.membershipPlan.updateMany({
    where: { id, gymId },
    data: { isActive: true },
  });
  if (result.count === 0) return { ok: false, error: "Plan not found." };

  revalidatePath("/settings");
  return { ok: true };
}

/**
 * True if retiring/deactivating plan `id` would leave the gym with zero active
 * plans — i.e. it is currently the only active plan.
 */
async function wouldLeaveNoActivePlan(
  gymId: string,
  id: string,
): Promise<boolean> {
  const activeIds = await prisma.membershipPlan.findMany({
    where: { gymId, isActive: true },
    select: { id: true },
  });
  return activeIds.length === 1 && activeIds[0]?.id === id;
}
