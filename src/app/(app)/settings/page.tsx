import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Settings · Block23 Gym" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Gym information, pricing, thresholds, and membership plans."
      />
      <p className="text-sm text-muted-foreground">
        Coming next — completes Milestone 1.
      </p>
    </>
  );
}
