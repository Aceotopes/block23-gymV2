"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_PERIODS,
  DASHBOARD_PERIOD_LABELS,
  type DashboardPeriod,
} from "./dashboard-period-options";

// Dashboard chart period toggle — Today / Week / Month (Module 1). URL state (ADR-047);
// the KPI cards always show their own contextual period regardless of this selector.
export function DashboardPeriodSelector({ period }: { period: DashboardPeriod }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-1">
      {DASHBOARD_PERIODS.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={period === p ? "default" : "outline"}
          onClick={() => router.push(`/dashboard?period=${p}`)}
        >
          {DASHBOARD_PERIOD_LABELS[p]}
        </Button>
      ))}
    </div>
  );
}
