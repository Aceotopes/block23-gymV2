import { redirect } from "next/navigation";
import { getCurrentGym } from "@/lib/gym";
import { gymToday } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { PosNav, type PosViewKey } from "./pos-nav";
import { ProductsView } from "./products-view";
import { SellView } from "./sell-view";
import { PosHistoryView } from "./pos-history-view";
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
  const flatSp: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

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
        <PosHistoryView
          gymId={gym.id}
          timezone={gym.timezone}
          today={gymToday(gym.timezone)}
          sp={flatSp}
        />
      ) : (
        <SellView gymId={gym.id} />
      )}
    </>
  );
}
