import { redirect } from "next/navigation";
import { getCurrentGym } from "@/lib/gym";
import { gymToday } from "@/lib/dates";
import { getClientList, defaultSortForChip } from "@/lib/clients/list";
import { PageHeader } from "@/components/page-header";
import { NewClientButton } from "./new-client-button";
import { ClientsToolbar } from "./clients-toolbar";
import { ClientFilterChips } from "./client-filter-chips";
import { ClientsTable } from "./clients-table";
import { parseClientsQuery, type RawSearchParams } from "./search-params";

export const metadata = { title: "Clients · Block23 Gym" };

const PAGE_SIZE = 25;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  const query = parseClientsQuery(await searchParams);
  const today = gymToday(gym.timezone);
  const fallback = defaultSortForChip(query.chip);

  const result = await getClientList({
    gymId: gym.id,
    today,
    thresholds: {
      expirationWarningDays: gym.expirationWarningDays,
      walkinInactivityThresholdDays: gym.walkinInactivityThresholdDays,
      memberInactivityWarningDays: gym.memberInactivityWarningDays,
    },
    q: query.q,
    chip: query.chip,
    showArchived: query.showArchived,
    sort: query.sort ?? fallback.sort,
    dir: query.dir ?? fallback.dir,
    page: query.page,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Search, filter, and manage every client in your gym."
        action={<NewClientButton />}
      />
      <div className="space-y-4">
        <ClientsToolbar query={query} />
        <ClientFilterChips query={query} />
        <ClientsTable query={query} result={result} />
      </div>
    </>
  );
}
