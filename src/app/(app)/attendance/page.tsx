import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Attendance · Block23 Gym" };

export default function AttendancePage() {
  return (
    <>
      <PageHeader
        title="Attendance"
        description="Check-in and attendance intelligence."
      />
      <p className="text-sm text-muted-foreground">Coming in Milestone 4.</p>
    </>
  );
}
