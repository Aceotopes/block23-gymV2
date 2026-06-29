import { prisma } from "@/lib/prisma";
import { formatDateOnly } from "@/lib/dates";
import { deriveClient } from "@/lib/clients/derive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CsvExportButton } from "../csv-export-button";
import { ReportNoData, type ReportProps } from "../report-shell";

// At-risk members (US-8.14) — a point-in-time list of active members (in-effect
// membership) whose last visit exceeds `Gym.member_inactivity_warning_days`, sorted by
// days since last visit descending. The at-risk signal is derived centrally
// (`deriveClient`, ADR-019/040), so this agrees with the Client List filter and the
// Dashboard panel. Members who never visited count as most at-risk (top of the list).
export async function AtRiskMembersReport({
  gymId,
  today,
  thresholds,
}: ReportProps) {
  const [clients, agg] = await Promise.all([
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
  ]);
  const aggMap = new Map(
    agg.map((a) => [
      a.clientId,
      { total: a._count._all, last: (a._max.visitDate as Date | null) ?? null },
    ]),
  );

  type Row = {
    name: string;
    expiry: Date | null;
    lastVisit: Date | null;
    daysSince: number | null;
    total: number;
  };
  const rows: Row[] = [];
  for (const c of clients) {
    const a = aggMap.get(c.id);
    const d = deriveClient({
      memberships: c.memberships,
      lastVisitDate: a?.last ?? null,
      totalVisits: a?.total ?? 0,
      today,
      thresholds,
    });
    if (!d.atRisk) continue;
    rows.push({
      name: c.fullName,
      expiry: d.membershipExpiry,
      lastVisit: d.lastVisitDate,
      daysSince: d.daysSinceLastVisit,
      total: d.totalVisits,
    });
  }
  rows.sort(
    (a, b) =>
      (b.daysSince ?? Infinity) - (a.daysSince ?? Infinity) ||
      a.name.localeCompare(b.name),
  );

  const csvHeaders = [
    "Member",
    "Membership expiry",
    "Last visit",
    "Days since last visit",
    "Total visits",
  ];
  const csvRows = rows.map((r) => [
    r.name,
    r.expiry ? formatDateOnly(r.expiry) : "",
    r.lastVisit ? formatDateOnly(r.lastVisit) : "",
    r.daysSince ?? "",
    r.total,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Active members with no visit in the last {thresholds.memberInactivityWarningDays}{" "}
          days.
        </p>
        <CsvExportButton
          filename="at-risk-members"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {rows.length === 0 ? (
        <ReportNoData message="All active members have visited recently." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Membership expiry</TableHead>
                <TableHead>Last visit</TableHead>
                <TableHead className="text-right">Days since last visit</TableHead>
                <TableHead className="text-right">Total visits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {r.expiry ? formatDateOnly(r.expiry) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {r.lastVisit ? formatDateOnly(r.lastVisit) : "Never"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.daysSince ?? "Never"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
