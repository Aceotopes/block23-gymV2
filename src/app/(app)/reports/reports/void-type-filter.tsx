"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const TYPES = [
  { key: "both", label: "Both" },
  { key: "CLIENT_TRANSACTION", label: "Client" },
  { key: "POS_SALE", label: "POS" },
] as const;

// Transaction-type filter for the Void Analysis report (US-8.15). Preserves the active
// period/from/to (passed in `keep`) when switching type. URL state (ADR-047).
export function VoidTypeFilter({
  type,
  keep,
}: {
  type: string;
  keep: { period: string; from: string; to: string };
}) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-1">
      {TYPES.map((t) => (
        <Button
          key={t.key}
          size="sm"
          variant={type === t.key ? "default" : "outline"}
          onClick={() =>
            router.push(
              `/reports/void-analysis?${new URLSearchParams({ ...keep, type: t.key }).toString()}`,
            )
          }
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
