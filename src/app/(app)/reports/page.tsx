import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Reports · Block23 Gym" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Archival, exportable reports across every module."
      />
      <p className="text-sm text-muted-foreground">Coming in Milestone 8.</p>
    </>
  );
}
