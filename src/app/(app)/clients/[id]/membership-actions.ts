"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import {
  gymToday,
  addDays,
  parseDateOnly,
  formatDateOnly,
} from "@/lib/dates";
import {
  deriveMembershipBlock,
  latestRelevantEnd,
  computeRenewalDates,
  type MembershipForDerivation,
} from "@/lib/clients/derive";
import {
  createMembershipSchema,
  renewMembershipSchema,
  CUSTOM_PLAN,
  type CreateMembershipValues,
  type RenewMembershipValues,
} from "./membership-schema";

// Membership lifecycle mutations (Milestone 3 — US-3.1/3.2/3.3/3.10). All scoped by
// the session's gymId (ADR-001/025) and re-validated server-side (TECH-STACK rule
// 10). `price_paid` is an immutable snapshot (ADR-003). NOTE: the payment record
// (CLIENT_TRANSACTION + payment method) for a membership is delivered in Milestone 5
// (US-5.1) — M3 creates the Membership with its price snapshot only.

export type MembershipBlockInfo = { kind: "active" | "upcoming"; message: string };

export type CreateMembershipResult =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; block: MembershipBlockInfo };

export type MembershipResult = { ok: true } | { ok: false; error: string };

/** Resolve the chosen plan to { planId, durationDays }, gym-scoped. */
async function resolvePlan(
  gymId: string,
  planChoice: string,
  customDays: number | null,
): Promise<{ planId: string | null; durationDays: number } | { error: string }> {
  if (planChoice === CUSTOM_PLAN) {
    if (!customDays || customDays < 1) return { error: "Enter a valid duration." };
    return { planId: null, durationDays: customDays };
  }
  const plan = await prisma.membershipPlan.findFirst({
    where: { id: planChoice, gymId },
    select: { id: true, durationDays: true },
  });
  if (!plan) return { error: "Selected plan was not found." };
  return { planId: plan.id, durationDays: plan.durationDays };
}

async function loadClientMemberships(
  clientId: string,
  gymId: string,
): Promise<MembershipForDerivation[] | null> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, gymId },
    select: {
      memberships: {
        select: { startDate: true, endDate: true, cancelledAt: true },
      },
    },
  });
  return client ? client.memberships : null;
}

export async function createMembership(
  clientId: string,
  input: CreateMembershipValues,
): Promise<CreateMembershipResult> {
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  const parsed = createMembershipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }
  const v = parsed.data;

  const memberships = await loadClientMemberships(clientId, gym.id);
  if (memberships === null) return { ok: false, error: "Client not found." };

  const today = gymToday(gym.timezone);

  // Blocking state (US-3.1, ADR-037): active → "Go to Renew"; upcoming → informational.
  const block = deriveMembershipBlock(memberships, today);
  if (block) {
    return {
      ok: false,
      block:
        block.kind === "active"
          ? {
              kind: "active",
              message: `This client has an active membership until ${formatDateOnly(
                block.endDate,
              )}. Did you mean to renew instead?`,
            }
          : {
              kind: "upcoming",
              message: `This client has a membership starting ${formatDateOnly(
                block.startDate,
              )}. No new membership can be created until that period ends.`,
            },
    };
  }

  const resolved = await resolvePlan(gym.id, v.planChoice, v.customDays);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const startDate = parseDateOnly(v.startDate);
  if (!startDate) return { ok: false, error: "Pick a valid start date." };
  // Start today or later (pre-purchase). Backdating is out of scope — cancel/recreate.
  if (startDate.getTime() < today.getTime()) {
    return { ok: false, error: "Start date can't be in the past." };
  }

  await prisma.membership.create({
    data: {
      gymId: gym.id,
      clientId,
      membershipPlanId: resolved.planId,
      startDate,
      endDate: addDays(startDate, resolved.durationDays),
      pricePaid: v.price,
      renewedFromMembershipId: null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function renewMembership(
  clientId: string,
  input: RenewMembershipValues,
): Promise<MembershipResult> {
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  const parsed = renewMembershipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }
  const v = parsed.data;

  // Need full membership rows (with ids) to link the renewal chain and compute the anchor.
  const client = await prisma.client.findFirst({
    where: { id: clientId, gymId: gym.id },
    select: {
      memberships: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          cancelledAt: true,
        },
      },
    },
  });
  if (!client) return { ok: false, error: "Client not found." };

  const live = client.memberships.filter((m) => m.cancelledAt === null);
  if (live.length === 0) {
    return { ok: false, error: "This client has no membership to renew." };
  }

  const resolved = await resolvePlan(gym.id, v.planChoice, v.customDays);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const today = gymToday(gym.timezone);
  const anchorEnd = latestRelevantEnd(live, today);
  const { startDate, endDate } = computeRenewalDates(
    anchorEnd,
    resolved.durationDays,
    today,
  );

  // Link to the previous record: the latest non-cancelled membership by end date
  // (the chain it extends). Never mutated (ADR-040, Flow 6).
  const previous = live.reduce((a, b) =>
    b.endDate.getTime() > a.endDate.getTime() ? b : a,
  );

  await prisma.membership.create({
    data: {
      gymId: gym.id,
      clientId,
      membershipPlanId: resolved.planId,
      startDate,
      endDate,
      pricePaid: v.price,
      renewedFromMembershipId: previous.id,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function cancelMembership(
  clientId: string,
  membershipId: string,
  reason: string,
): Promise<MembershipResult> {
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  const trimmed = reason.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "A cancellation reason is required." };
  }

  // Soft cancel (ADR-041). Only an uncancelled record is affected; gym-scoped.
  const result = await prisma.membership.updateMany({
    where: { id: membershipId, gymId: gym.id, clientId, cancelledAt: null },
    data: { cancelledAt: new Date(), cancellationReason: trimmed.slice(0, 500) },
  });
  if (result.count === 0) {
    return { ok: false, error: "Membership not found or already cancelled." };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
