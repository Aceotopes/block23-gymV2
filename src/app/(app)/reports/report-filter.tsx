"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

// Generic single-param segmented filter for reports (ADR-047 — URL state). Updates one
// search param while preserving every other (period/from/to/etc.), so it composes with
// the shared ReportPeriodSelector. Used by the Part-3 report filters (status, plan
// status, comparison toggle, …). The matching `extra` must be handed to the period
// selector so the value also survives a period change.
export function ReportSegmentFilter({
  param,
  value,
  options,
  label,
}: {
  param: string;
  value: string;
  options: readonly { key: string; label: string }[];
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function push(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {label ? (
        <span className="text-muted-foreground mr-1 text-sm">{label}</span>
      ) : null}
      {options.map((o) => (
        <Button
          key={o.key}
          size="sm"
          variant={value === o.key ? "default" : "outline"}
          onClick={() => push(o.key)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
