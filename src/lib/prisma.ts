import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Singleton Prisma client. Next.js dev hot-reload re-evaluates modules, which
// would otherwise spawn a new client (and a new connection pool) on every reload
// and exhaust connections — so in non-production we cache it on globalThis.
// (TECH-STACK → Backend Standards: "The Prisma client must be instantiated as a
// singleton to avoid exhausting connections during local development.")
//
// Prisma 7 connects through a driver adapter. The runtime client uses the POOLED
// connection (DATABASE_URL — Neon pooler); the Prisma CLI / migrations use the
// direct connection (DATABASE_URL_UNPOOLED) via prisma.config.ts.

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
