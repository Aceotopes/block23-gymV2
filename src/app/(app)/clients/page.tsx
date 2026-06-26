import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Clients · Block23 Gym" };

export default function ClientsPage() {
  return (
    <>
      <PageHeader
        title="Clients"
        description="Client registry, profiles, and all membership operations."
      />
      <p className="text-sm text-muted-foreground">Coming in Milestone 2.</p>
    </>
  );
}
