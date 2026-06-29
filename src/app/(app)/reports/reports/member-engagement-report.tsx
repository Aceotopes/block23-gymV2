import { prisma } from "@/lib/prisma";
import {
  toDateInputValue,
  parseDateOnly,
  formatDateOnly,
} from "@/lib/dates";
import {
  isReportPeriod,
  reportRange,
  priorRange,
  type ReportPeriod,
} from "@/lib/reports/period";
import { deriveClient } from "@/lib/clients/derive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportPeriodSelector } from "../report-period";
import { CsvExportButton } from "../csv-export-button";
import { ReportNoData, type ReportProps } from "../report-shell";

// Member engagement (US-8.13) — every active MEMBER client with all-time visits, visits
// in the selected period vs. the prior equivalent period (default Monthly = this month
// vs. last month), and days since last visit. Sorted least-engaged first (most days
// since last visit). Active-member derivation is centralized (`deriveClient`).
export async function MemberEngagementReport({
  gymId,
  today,
  thresholds,
  sp,
}: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);
  const prior = priorRange({ from, to });

  const [clients, allTime, periodAgg, priorAgg] = await Promise.all([
    prisma.client.findMany({
      where: { gymId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        memberships: {
          select: { startDate: true, endDate: true, cancelledAt: true },
        },
      },
    }),
    prisma.attendance.groupBy({
      by: ["clientId"],
      where: { gymId },
      _count: { _all: true },
      _max: { visitDate: true },
    }),
    prisma.attendance.groupBy({
      by: ["clientId"],
      where: { gymId, visitDate: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({
      by: ["clientId"],
      where: { gymId, visitDate: { gte: prior.from, lte: prior.to } },
      _count: { _all: true },
    }),
  ]);

  const allTimeMap = new Map(
    allTime.map((a) => [
      a.clientId,
      { total: a._count._all, last: (a._max.visitDate as Date | null) ?? null },
    ]),
  );
  const periodMap = new Map(periodAgg.map((a) => [a.clientId, a._count._all]));
  const priorMap = new Map(priorAgg.map((a) => [a.clientId, a._count._all]));

  type Row = {
    name: string;
    total: number;
    periodVisits: number;
    priorVisits: number;
    daysSince: number | null;
  };
  const rows: Row[] = [];
  for (const c of clients) {
    const at = allTimeMap.get(c.id);
    const d = deriveClient({
      memberships: c.memberships,
      lastVisitDate: at?.last ?? null,
      totalVisits: at?.total ?? 0,
      today,
      thresholds,
    });
    if (!d.isActiveMembership) continue; // active members only (US-8.13)
    rows.push({
      name: c.fullName,
      total: at?.total ?? 0,
      periodVisits: periodMap.get(c.id) ?? 0,
      priorVisits: priorMap.get(c.id) ?? 0,
      daysSince: d.daysSinceLastVisit,
    });
  }
  // Least engaged first: most days since last visit (never-visited → top).
  rows.sort(
    (a, b) =>
      (b.daysSince ?? Infinity) - (a.daysSince ?? Infinity) ||
      a.name.localeCompare(b.name),
  );

  const csvHeaders = [
    "Member",
    "Total visits",
    "Visits (selected period)",
    "Visits (prior period)",
    "Days since last visit",
  ];
  const csvRows = rows.map((r) => [
    r.name,
    r.total,
    r.periodVisits,
    r.priorVisits,
    r.daysSince ?? "",
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportPeriodSelector
          basePath="/reports/member-engagement"
          period={period}
          from={sp.from ?? toDateInputValue(from)}
          to={sp.to ?? toDateInputValue(to)}
        />
        <CsvExportButton
          filename={`member-engagement-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      <p className="text-muted-foreground text-sm">
        Selected period {formatDateOnly(from)} – {formatDateOnly(to)} · prior{" "}
        {formatDateOnly(prior.from)} – {formatDateOnly(prior.to)}.
      </p>

      {rows.length === 0 ? (
        <ReportNoData message="No active members." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Total visits</TableHead>
                <TableHead className="text-right">Selected period</TableHead>
                <TableHead className="text-right">Prior period</TableHead>
                <TableHead className="text-right">Days since last visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.periodVisits}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.priorVisits}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.daysSince ?? "Never"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
