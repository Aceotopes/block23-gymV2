import Link from "next/link";
import { ArrowLeft, FileBarChart } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// Shared report-page chrome (Module 8). Each `/reports/[slug]` report renders a back
// link, then its own period toolbar + table. `sp` is the flattened URL search params.
// `thresholds` are the gym's derivation settings (status/at-risk/conversion windows),
// reused so reports agree with the Client List, Dashboard, and Analytics surfaces.
export type ReportThresholds = {
  expirationWarningDays: number;
  walkinInactivityThresholdDays: number;
  memberInactivityWarningDays: number;
  walkinConversionPromptVisits: number;
};

export type ReportProps = {
  gymId: string;
  timezone: string;
  today: Date;
  thresholds: ReportThresholds;
  sp: Record<string, string | undefined>;
};

export function ReportBackLink() {
  return (
    <Link
      href="/reports"
      className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All reports
    </Link>
  );
}

export function ReportNoData({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={FileBarChart}
      title="No data for this period"
      description={message ?? "Adjust the period above to see results."}
    />
  );
}

export function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
