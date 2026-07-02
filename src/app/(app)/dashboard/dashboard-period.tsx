"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_PERIODS,
  DASHBOARD_PERIOD_LABELS,
  type DashboardPeriod,
} from "./dashboard-period-options";

// Dashboard chart period toggle — Today / Week / Month (Module 1), as the segmented
// pill from the Block 23 Console prototype. URL state (ADR-047); the KPI cards always
// show their own contextual period regardless of this selector.
export function DashboardPeriodSelector({ period }: { period: DashboardPeriod }) {
  const router = useRouter();
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      {DASHBOARD_PERIODS.map((p) => {
        const active = period === p;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={active}
            onClick={() => router.push(`/dashboard?period=${p}`)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[image:var(--b23-grad-primary)] text-[var(--b23-primary-on)] shadow-[var(--b23-glow-btn)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {DASHBOARD_PERIOD_LABELS[p]}
          </button>
        );
      })}
    </div>
  );
}
