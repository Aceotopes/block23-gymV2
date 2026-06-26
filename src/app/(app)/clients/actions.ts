"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { gymToday } from "@/lib/dates";
import { isSimilarName } from "@/lib/clients/duplicate";
import { clientSchema, type ClientFormValues } from "./client-schema";

// All client mutations are scoped by the session's gymId (ADR-001/025) and
// re-validate with Zod server-side regardless of client validation (TECH-STACK
// rule 10). Status/type are never written — they are derived at read time.

export type DuplicateMatch = { id: string; fullName: string };

export type CreateClientResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | { ok: false; duplicates: DuplicateMatch[] };

export type MutateResult = { ok: true } | { ok: false; error: string };

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createClient(
  input: ClientFormValues,
  force = false,
): Promise<CreateClientResult> {
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields and try again.",
    };
  }
  const v = parsed.data;

  // Non-blocking duplicate check (US-2.1). Only against active clients; skipped
  // once the owner confirms with `force`.
  if (!force) {
    const candidates = await prisma.client.findMany({
      where: { gymId: gym.id, deletedAt: null },
      select: { id: true, fullName: true },
    });
    const duplicates = candidates.filter((c) =>
      isSimilarName(c.fullName, v.fullName),
    );
    if (duplicates.length > 0) {
      return { ok: false, duplicates };
    }
  }

  const created = await prisma.client.create({
    data: {
      gymId: gym.id,
      fullName: v.fullName,
      contactNumber: clean(v.contactNumber),
      email: clean(v.email),
      notes: clean(v.notes),
      // date_registered is system-generated as the gym-local current date (ADR-035).
      dateRegistered: gymToday(gym.timezone),
    },
    select: { id: true },
  });

  revalidatePath("/clients");
  return { ok: true, id: created.id };
}

export async function updateClient(
  id: string,
  input: ClientFormValues,
): Promise<MutateResult> {
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields and try again.",
    };
  }
  const v = parsed.data;

  // Scope the update by gymId so a client of another tenant can never be touched.
  const result = await prisma.client.updateMany({
    where: { id, gymId: gym.id },
    data: {
      fullName: v.fullName,
      contactNumber: clean(v.contactNumber),
      email: clean(v.email),
      notes: clean(v.notes),
    },
  });
  if (result.count === 0) return { ok: false, error: "Client not found." };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true };
}

// Soft delete / restore (US-2.6, ADR-005). History is never touched.
export async function archiveClient(id: string): Promise<MutateResult> {
  return setArchived(id, true);
}

export async function reactivateClient(id: string): Promise<MutateResult> {
  return setArchived(id, false);
}

async function setArchived(
  id: string,
  archived: boolean,
): Promise<MutateResult> {
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  const result = await prisma.client.updateMany({
    where: { id, gymId: gym.id },
    data: { deletedAt: archived ? new Date() : null },
  });
  if (result.count === 0) return { ok: false, error: "Client not found." };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true };
}
