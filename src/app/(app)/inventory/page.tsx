import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Inventory · Block23 Gym" };

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock ledger, restock, adjustments, and valuation."
      />
      <p className="text-sm text-muted-foreground">Coming in Milestone 7.</p>
    </>
  );
}
