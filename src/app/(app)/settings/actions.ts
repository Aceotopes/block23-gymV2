"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionGymId } from "@/lib/gym";
import { gymSettingsSchema, type GymSettingsValues } from "./settings-schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Persist gym settings to the single Gym row, scoped by the session's gymId.
// Re-validates server-side regardless of client validation (TECH-STACK). Changing
// the walk-in fee affects only future transactions — snapshots are never rewritten
// (ADR-003), which is structural (price_paid is copied at sale time).
export async function updateGymSettings(
  input: GymSettingsValues,
): Promise<ActionResult> {
  const gymId = await getSessionGymId();
  if (!gymId) return { ok: false, error: "Not authenticated." };

  const parsed = gymSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }
  const v = parsed.data;

  await prisma.gym.update({
    where: { id: gymId },
    data: {
      name: v.name,
      address: v.address,
      contactInfo: v.contactInfo,
      timezone: v.timezone,
      defaultWalkinFee: v.defaultWalkinFee,
      expirationWarningDays: v.expirationWarningDays,
      walkinInactivityThresholdDays: v.walkinInactivityThresholdDays,
      memberInactivityWarningDays: v.memberInactivityWarningDays,
      walkinConversionPromptVisits: v.walkinConversionPromptVisits,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}
