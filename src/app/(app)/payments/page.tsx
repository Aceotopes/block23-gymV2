import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Client Payments · Block23 Gym" };

export default function PaymentsPage() {
  return (
    <>
      <PageHeader
        title="Client Payments"
        description="Membership and walk-in payment history, voids, and collections."
      />
      <p className="text-sm text-muted-foreground">Coming in Milestone 5.</p>
    </>
  );
}
