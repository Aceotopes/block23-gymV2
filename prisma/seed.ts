import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

// Seeds the single gym + owner account. Idempotent: skips if any user exists.
// Configure via env (set real values before running for production):
//   SEED_OWNER_USERNAME, SEED_OWNER_EMAIL, SEED_OWNER_PASSWORD, SEED_OWNER_NAME
//   SEED_GYM_NAME, SEED_GYM_TIMEZONE
// Run: pnpm db:seed
async function main() {
  const username = process.env.SEED_OWNER_USERNAME ?? "owner";
  const email = process.env.SEED_OWNER_EMAIL ?? "owner@block23.local";
  const password = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe!123";
  const name = process.env.SEED_OWNER_NAME ?? "Gym Owner";

  const existing = await prisma.user.findFirst();
  if (existing) {
    console.log("Seed skipped — a user already exists.");
    return;
  }

  const gym = await prisma.gym.create({
    data: {
      name: process.env.SEED_GYM_NAME ?? "Block23 Gym",
      address: "",
      contactInfo: "",
      defaultWalkinFee: 0,
      expirationWarningDays: 7,
      timezone: process.env.SEED_GYM_TIMEZONE ?? "Asia/Manila",
    },
  });

  const user = await prisma.user.create({
    data: {
      gymId: gym.id,
      name,
      email,
      emailVerified: true,
      username,
      displayUsername: username,
      role: "OWNER",
    },
  });

  // Hash with Better Auth's own hasher so sign-in verifies correctly. The
  // credential account mirrors what Better Auth's sign-up would create
  // (providerId "credential", accountId = user.id).
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hash,
    },
  });

  console.log(`Seeded gym "${gym.name}" + owner "${username}" (${email}).`);
  if (!process.env.SEED_OWNER_PASSWORD) {
    console.warn(
      "⚠️  Used the default password. Set SEED_OWNER_* env vars and re-seed, or change it after first login.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
