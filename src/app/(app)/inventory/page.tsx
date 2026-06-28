import { redirect } from "next/navigation";
import { getCurrentGym } from "@/lib/gym";
import { gymToday } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { InventoryNav, type InventoryViewKey } from "./inventory-nav";
import { StockView } from "./stock-view";
import { MovementsView } from "./movements-view";
import {
  parseStockQuery,
  type RawSearchParams,
} from "./inventory-search-params";

export const metadata = { title: "Inventory · Block23 Gym" };

function asView(value: string | undefined): InventoryViewKey {
  return value === "movements" ? "movements" : "stock";
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  const sp = await searchParams;
  const view = asView(typeof sp.view === "string" ? sp.view : undefined);
  const today = gymToday(gym.timezone);
  const flatSp: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock levels, restocks, adjustments, and the movement ledger."
      />
      <InventoryNav current={view} />

      {view === "movements" ? (
        <MovementsView
          gymId={gym.id}
          timezone={gym.timezone}
          today={today}
          sp={flatSp}
        />
      ) : (
        <StockView
          gymId={gym.id}
          timezone={gym.timezone}
          today={today}
          query={parseStockQuery(sp)}
        />
      )}
    </>
  );
}
