"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ANALYTICS_PERIODS,
  ANALYTICS_PERIOD_LABELS,
  type AnalyticsPeriod,
} from "@/lib/attendance/analytics";

// Global period selector for the charts (US-4.10). State in the URL (ADR-047).
export function AnalyticsPeriodSelector({
  period,
  from,
  to,
}: {
  period: AnalyticsPeriod;
  from: string;
  to: string;
}) {
  const router = useRouter();

  function push(next: Record<string, string>) {
    const params = new URLSearchParams({
      view: "analytics",
      period,
      from,
      to,
      ...next,
    });
    router.push(`/attendance?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-1">
        {ANALYTICS_PERIODS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "default" : "outline"}
            onClick={() => push({ period: p })}
          >
            {ANALYTICS_PERIOD_LABELS[p]}
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
