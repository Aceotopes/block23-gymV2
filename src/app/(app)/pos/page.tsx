import { PageHeader } from "@/components/page-header";

export const metadata = { title: "POS · Block23 Gym" };

export default function PosPage() {
  return (
    <>
      <PageHeader
        title="POS"
        description="Product sales and product catalog management."
      />
      <p className="text-sm text-muted-foreground">Coming in Milestone 6.</p>
    </>
  );
}
