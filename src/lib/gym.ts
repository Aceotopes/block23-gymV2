import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Server-only helpers for the current tenant's gym. Every gym-scoped read/write
// resolves the gym from the session (ADR-001/025 — scope by gym_id).

export async function getSessionGymId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const gymId = (session?.user as { gymId?: string } | undefined)?.gymId;
  return gymId ?? null;
}

export async function getCurrentGym() {
  const gymId = await getSessionGymId();
  if (!gymId) return null;
  return prisma.gym.findUnique({ where: { id: gymId } });
}
