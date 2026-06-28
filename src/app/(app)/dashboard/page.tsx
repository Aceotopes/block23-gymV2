import { redirect } from "next/navigation";
import { getCurrentGym } from "@/lib/gym";
import { gymToday } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { DashboardView } from "./dashboard-view";
import { isDashboardPeriod, type DashboardPeriod } from "./dashboard-period-options";

export const metadata = { title: "Dashboard · Block23 Gym" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  const sp = await searchParams;
  const rawPeriod = typeof sp.period === "string" ? sp.period : undefined;
  const period: DashboardPeriod = isDashboardPeriod(rawPeriod) ? rawPeriod : "week";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Daily operational command center."
      />
      <DashboardView
        gymId={gym.id}
        timezone={gym.timezone}
        today={gymToday(gym.timezone)}
        period={period}
        thresholds={{
          expirationWarningDays: gym.expirationWarningDays,
          walkinInactivityThresholdDays: gym.walkinInactivityThresholdDays,
          memberInactivityWarningDays: gym.memberInactivityWarningDays,
        }}
      />
    </>
  );
}
