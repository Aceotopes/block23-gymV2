import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCurrentGym } from "@/lib/gym";
import { gymToday } from "@/lib/dates";
import { DashboardView } from "./dashboard-view";
import { DashboardPeriodSelector } from "./dashboard-period";
import { isDashboardPeriod, type DashboardPeriod } from "./dashboard-period-options";

export const metadata = { title: "Dashboard · Block23 Gym" };

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [gym, session] = await Promise.all([
    getCurrentGym(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  if (!gym) redirect("/login");

  const sp = await searchParams;
  const rawPeriod = typeof sp.period === "string" ? sp.period : undefined;
  const period: DashboardPeriod = isDashboardPeriod(rawPeriod) ? rawPeriod : "week";

  // Greeting + date in the gym timezone (ADR-035).
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: gym.timezone,
      hour: "numeric",
      hour12: false,
    }).format(now),
  );
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: gym.timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);
  const firstName = (session?.user.name ?? "").trim().split(/\s+/)[0] || "there";

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold leading-tight tracking-[var(--b23-track-display)] text-foreground">
            {greeting(hour)}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here&apos;s how{" "}
            <span className="font-medium text-[var(--b23-fg-2)]">{gym.name}</span>{" "}
            is running — {dateLabel}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardPeriodSelector period={period} />
          <Link
            href="/payments?view=collections"
            className="inline-flex items-center gap-2 rounded-full bg-[image:var(--b23-grad-primary)] px-[18px] py-2.5 text-[13px] font-semibold text-[var(--b23-primary-on)] shadow-[var(--b23-glow-btn)] transition-[filter] hover:brightness-110"
          >
            Reconcile day
            <ArrowRight className="size-[15px]" aria-hidden />
          </Link>
        </div>
      </header>

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
