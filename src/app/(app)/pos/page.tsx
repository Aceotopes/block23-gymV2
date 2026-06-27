import { redirect } from "next/navigation";
import { getCurrentGym } from "@/lib/gym";
import { PageHeader } from "@/components/page-header";
import { PosNav, type PosViewKey } from "./pos-nav";
import { ProductsView } from "./products-view";
import { parseProductsQuery, type RawSearchParams } from "./products-search-params";

export const metadata = { title: "POS · Block23 Gym" };

function asView(value: string | undefined): PosViewKey {
  return value === "products" || value === "history" ? value : "sell";
}

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  const sp = await searchParams;
  const view = asView(typeof sp.view === "string" ? sp.view : undefined);

  return (
    <>
      <PageHeader
        title="POS"
        description="Product sales and product catalog management."
      />
      <PosNav current={view} />

      {view === "products" ? (
        <ProductsView gymId={gym.id} query={parseProductsQuery(sp)} />
      ) : view === "history" ? (
        <p className="text-muted-foreground text-sm">
          POS History — the `POS_SALE` list and void action arrive in Milestone 6
          Part 2.
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          The POS sell screen (grid, cart, checkout) arrives in Milestone 6 Part 2.
          Set up your catalog under <span className="font-medium">Products</span>{" "}
          first.
        </p>
      )}
    </>
  );
}
