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

/** The authenticated user's id + gym id (for writes that stamp `created_by`). */
export async function getSessionContext(): Promise<{
  userId: string;
  gymId: string;
} | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as
    | { id?: string; gymId?: string }
    | undefined;
  if (!user?.id || !user.gymId) return null;
  return { userId: user.id, gymId: user.gymId };
}

export async function getCurrentGym() {
  const gymId = await getSessionGymId();
  if (!gymId) return null;
  return prisma.gym.findUnique({ where: { id: gymId } });
}
