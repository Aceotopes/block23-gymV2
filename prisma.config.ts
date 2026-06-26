// Loads .env so the schema's url/directUrl env() references resolve for the CLI.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI / migrations use the DIRECT (unpooled) connection — required on Neon.
    // The app runtime client uses the pooled DATABASE_URL (see src/lib/prisma.ts).
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
