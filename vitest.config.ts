import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest is the only test runner (TECH-STACK). Tests are co-located as
// `*.test.ts` next to the code they cover. DB-touching tests use a Neon test
// branch, never SQLite (added when the first such test is written).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
