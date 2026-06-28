"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  type ReportPeriod,
} from "@/lib/reports/period";

// Shared report period selector (US-8.2/8.3/8.4/8.15) — Daily / Weekly / Monthly /
// This Year / Custom. URL state (ADR-047). `extra` preserves any report-specific
// params (e.g. void-analysis transaction type) across a period change.
export function ReportPeriodSelector({
  basePath,
  period,
  from,
  to,
  extra,
}: {
  basePath: string;
  period: ReportPeriod;
  from: string;
  to: string;
  extra?: Record<string, string>;
}) {
  const router = useRouter();

  function push(next: Record<string, string>) {
    const params = new URLSearchParams({
      ...extra,
      period,
      from,
      to,
      ...next,
    });
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-1">
        {REPORT_PERIODS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "default" : "outline"}
            onClick={() => push({ period: p })}
          >
            {REPORT_PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>
      {period === "custom" ? (
        <div className="flex items-end gap-2">
          <Input
            type="date"
            aria-label="From"
            value={from}
            max={to || undefined}
            className="w-40 tabular-nums"
            onChange={(e) => push({ from: e.target.value })}
          />
          <span className="text-muted-foreground pb-2 text-sm">to</span>
          <Input
            type="date"
            aria-label="To"
            value={to}
            min={from || undefined}
            className="w-40 tabular-nums"
            onChange={(e) => push({ to: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
