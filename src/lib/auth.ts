import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

// Better Auth is configured against the domain `User` table (ADR-043/ADR-046):
// one canonical user record, `gymId`/`role` as additional fields, credential
// password hashes in the Better-Auth-owned `account` table. Login is by username
// (US-1.1). Public sign-up is disabled — the owner is provisioned via the seed.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // no public registration at MVP; owner is seeded
  },
  plugins: [username()],
  user: {
    additionalFields: {
      // Exposed on the session user ({ userId, gymId, role }). Managed server-side
      // (seed), never accepted from client input.
      gymId: { type: "string", required: true, input: false },
      role: { type: "string", required: false, input: false, defaultValue: "OWNER" },
    },
  },
  advanced: {
    // The DB generates ids (Prisma @default(uuid(7))) — keeps uuid PKs consistent
    // with the domain FKs that reference User.id.
    database: { generateId: false },
  },
});
