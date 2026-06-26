import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/dates";
import { deriveClient } from "@/lib/clients/derive";
import {
  analyticsRange,
  rangeDays,
  dailyTrend,
  byHour,
  byDayOfWeek,
  peakHours,
  peakDays,
  newVsReturning,
  hourLabel,
  type AnalyticsPeriod,
  type AttRow,
} from "@/lib/attendance/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsPeriodSelector } from "./analytics-period";
import {
  DailyTrendChart,
  DayOfWeekChart,
  ByHourChart,
} from "./analytics-charts";

// Attendance Analytics (US-4.10). Read-only aggregate metrics, trends, and
// operational signals — attendance-domain only (no revenue/inventory), no CSV
// (that's Reports/M8). All derived counts reuse the shared client derivation so
// signals match the Client List + Dashboard. Historical rows from soft-deleted
// clients are included in trends but excluded from active-member counts.
export async function AnalyticsView({
  gymId,
  today,
  period,
  customFrom,
  customTo,
  fromStr,
  toStr,
  thresholds,
  conversionThreshold,
}: {
  gymId: string;
  today: Date;
  period: AnalyticsPeriod;
  customFrom: Date | null;
  customTo: Date | null;
  fromStr: string;
  toStr: string;
  thresholds: {
    expirationWarningDays: number;
    walkinInactivityThresholdDays: number;
    memberInactivityWarningDays: number;
  };
  conversionThreshold: number;
}) {
  const { from, to } = analyticsRange(period, today, customFrom, customTo);
  const periodLen = rangeDays(from, to);
  const priorFrom = addDays(from, -periodLen);
  const priorTo = addDays(from, -1);

  // Calendar week (Mon-based) and month-to-date boundaries for the KPI cards.
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const weekStart = addDays(today, -mondayOffset);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );

  const [
    periodRecords,
    todayCount,
    weekCount,
    monthRecords,
    attAgg,
    walkInAgg,
    clients,
    priorCount,
  ] = await Promise.all([
    prisma.attendance.findMany({
      where: { gymId, visitDate: { gte: from, lte: to } },
      select: { clientId: true, visitType: true, visitDate: true, timeIn: true },
    }),
    prisma.attendance.count({ where: { gymId, visitDate: today } }),
    prisma.attendance.count({
      where: { gymId, visitDate: { gte: weekStart, lte: today } },
    }),
    prisma.attendance.findMany({
      where: { gymId, visitDate: { gte: monthStart, lte: today } },
      select: { visitType: true },
    }),
    prisma.attendance.groupBy({
      by: ["clientId"],
      where: { gymId },
      _count: { _all: true },
      _max: { visitDate: true },
      _min: { visitDate: true },
    }),
    prisma.attendance.groupBy({
      by: ["clientId"],
      where: { gymId, visitType: "WALK_IN" },
      _count: { _all: true },
    }),
    prisma.client.findMany({
      where: { gymId, deletedAt: null },
      select: {
        id: true,
        memberships: {
          select: {
            startDate: true,
            endDate: true,
            cancelledAt: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.attendance.count({
      where: { gymId, visitDate: { gte: priorFrom, lte: priorTo } },
    }),
  ]);

  const periodRows: AttRow[] = periodRecords.map((r) => ({
    clientId: r.clientId,
    visitType: r.visitType,
    visitDate: r.visitDate,
    timeIn: r.timeIn,
  }));

  const aggMap = new Map(attAgg.map((a) => [a.clientId, a]));
  const firstEver = new Map<string, Date>();
  for (const a of attAgg) {
    if (a._min.visitDate) firstEver.set(a.clientId, a._min.visitDate as Date);
  }
  const walkInClientIds = new Set(walkInAgg.map((w) => w.clientId));

  // ── Derive every active client once (shared definitions) ──
  let activeMembers = 0;
  let atRiskCount = 0;
  let walkInOnly = 0;
  let frequentWalkIns = 0;
  let convertedLifetime = 0;
  let convertedInPeriod = 0;
  for (const c of clients) {
    const agg = aggMap.get(c.id);
    const derived = deriveClient({
      memberships: c.memberships,
      lastVisitDate: (agg?._max.visitDate as Date | null) ?? null,
      totalVisits: agg?._count._all ?? 0,
      today,
      thresholds,
    });
    if (derived.clientType === "MEMBER") {
      if (derived.isActiveMembership) activeMembers += 1;
      if (derived.atRisk) atRiskCount += 1;
      // Conversion (ADR-020): a member who ever had a walk-in visit.
      if (walkInClientIds.has(c.id)) {
        convertedLifetime += 1;
        const earliest = c.memberships
          .filter((m) => m.cancelledAt === null)
          .map((m) => m.createdAt)
          .sort((a, b) => a.getTime() - b.getTime())[0];
        if (
          earliest &&
          earliest.getTime() >= from.getTime() &&
          earliest.getTime() <= addDays(to, 1).getTime()
        ) {
          convertedInPeriod += 1;
        }
      }
    } else {
      walkInOnly += 1;
      if ((agg?._count._all ?? 0) >= conversionThreshold) frequentWalkIns += 1;
    }
  }

  // ── Chart data ──
  const trend = dailyTrend(periodRows, from, to);
  const hours = byHour(periodRows);
  const dows = byDayOfWeek(periodRows, from, to);
  const topHours = peakHours(hours);
  const topDays = peakDays(dows);

  // ── Period KPIs ──
  const periodTotal = periodRows.length;
  const memberVisitsInPeriod = periodRows.filter(
    (r) => r.visitType === "MEMBER",
  );
  const uniqueVisitingMembers = new Set(
    memberVisitsInPeriod.map((r) => r.clientId),
  ).size;
  const avgVisitsPerMember = activeMembers
    ? memberVisitsInPeriod.length / activeMembers
    : 0;
  const utilizationRate = activeMembers
    ? (uniqueVisitingMembers / activeMembers) * 100
    : 0;
  const conversionRate = walkInClientIds.size
    ? (convertedLifetime / walkInClientIds.size) * 100
    : 0;
  const { newCount, returningCount } = newVsReturning(
    periodRows,
    firstEver,
    from,
    to,
  );

  // Month member/walk-in ratio.
  const monthMember = monthRecords.filter((r) => r.visitType === "MEMBER").length;
  const monthTotal = monthRecords.length;
  const memberPct = monthTotal ? Math.round((monthMember / monthTotal) * 100) : 0;

  // Decline alert: ≥20% below the equivalent prior period.
  const declined = priorCount > 0 && periodTotal <= priorCount * 0.8;
  const declinePct =
    priorCount > 0 ? Math.round((1 - periodTotal / priorCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI cards (fixed periods) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Today's check-ins" value={String(todayCount)} />
        <Kpi label="This week" value={String(weekCount)} />
        <Kpi label="This month" value={String(monthTotal)} />
        <Kpi
          label="Member vs walk-in (month)"
          value={monthTotal ? `${memberPct}% / ${100 - memberPct}%` : "—"}
          hint={monthTotal ? "Member · Walk-in" : "No check-ins yet"}
        />
      </div>

      {declined ? (
        <div
          role="alert"
          className="border-warning-on/30 bg-warning-on/10 text-warning-on rounded-md border p-3 text-sm font-medium"
        >
          Attendance is down {declinePct}% versus the previous{" "}
          {periodLen}-day period ({periodTotal} vs {priorCount} check-ins).
        </div>
      ) : null}

      <AnalyticsPeriodSelector period={period} from={fromStr} to={toStr} />

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Daily attendance trend</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyTrendChart data={trend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average check-ins by day of week</CardTitle>
          </CardHeader>
          <CardContent>
            <DayOfWeekChart data={dows} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Check-ins by hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ByHourChart data={hours} />
          </CardContent>
        </Card>
      </div>

      {/* Insight panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Member insights">
          <Stat
            label="At-risk members"
            value={String(atRiskCount)}
            href="/clients?chip=at-risk"
          />
          <Stat
            label="Avg visits / member (period)"
            value={avgVisitsPerMember.toFixed(1)}
          />
          <Stat
            label="Member utilization (period)"
            value={`${utilizationRate.toFixed(0)}%`}
            hint={`${uniqueVisitingMembers} of ${activeMembers} active members visited`}
          />
        </Panel>

        <Panel title="Walk-in insights">
          <Stat
            label="Frequent walk-ins"
            value={String(frequentWalkIns)}
            href="/clients?chip=walk-in-only"
          />
          <Stat
            label="Conversion candidates"
            value={String(walkInOnly)}
            href="/clients?chip=walk-in-only"
          />
          <Stat
            label="Conversions (period)"
            value={String(convertedInPeriod)}
            hint={`${convertedLifetime} lifetime · ${conversionRate.toFixed(0)}% of ever-walk-ins`}
          />
        </Panel>

        <Panel title="Operational insights">
          <Stat
            label="Peak hours"
            value={
              topHours.length
                ? topHours.map((h) => hourLabel(h.hour)).join(", ")
                : "—"
            }
          />
          <Stat
            label="Peak days"
            value={topDays.length ? topDays.map((d) => d.label).join(", ") : "—"}
          />
          <Stat
            label="New vs returning (period)"
            value={`${newCount} / ${returningCount}`}
            hint="New · Returning visitors"
          />
        </Panel>
      </div>

      {/* Alerts */}
      <Panel title="Alerts">
        <Stat
          label="Active members inactive beyond threshold"
          value={String(atRiskCount)}
          href="/clients?chip=at-risk"
        />
        <Stat
          label="Walk-ins past the conversion threshold"
          value={String(frequentWalkIns)}
          href="/clients?chip=walk-in-only"
        />
      </Panel>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
  return (
    <div className="space-y-0.5">
      {href ? (
        <Link href={href} className="hover:text-primary block">
          {body}
        </Link>
      ) : (
        body
      )}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}
