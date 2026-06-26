import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

// Smoke test: confirms the test runner, TS, and the `@/` alias all resolve.
describe("cn", () => {
  it("merges conditional classes", () => {
    expect(cn("text-sm", false && "hidden", "font-medium")).toBe(
      "text-sm font-medium",
    );
  });

  it("dedupes conflicting tailwind utilities (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
