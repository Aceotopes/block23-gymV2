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

// Frequent walk-ins (US-8.8) — walk-in clients (no membership history → WALK_IN type)
// whose lifetime visit count meets `Gym.walkin_conversion_prompt_visits`, ranked by
// visit count. These are upsell/conversion candidates (ADR-020: once they buy a
// membership they become MEMBER and drop off this list). Client type is derived
// centrally (`deriveClient`); the threshold matches the check-in conversion prompt.
export async function FrequentWalkInsReport({
  gymId,
  today,
  thresholds,
}: ReportProps) {
  const threshold = thresholds.walkinConversionPromptVisits;

  const [clients, agg] = await Promise.all([
    prisma.client.findMany({
      where: { gymId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        contactNumber: true,
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
    contact: string | null;
    total: number;
    lastVisit: Date | null;
    daysSince: number | null;
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
    if (d.clientType !== "WALK_IN") continue;
    if (d.totalVisits < threshold) continue;
    rows.push({
      name: c.fullName,
      contact: c.contactNumber,
      total: d.totalVisits,
      lastVisit: d.lastVisitDate,
      daysSince: d.daysSinceLastVisit,
    });
  }
  rows.sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name),
  );

  const csvHeaders = [
    "Client",
    "Contact",
    "Total visits",
    "Last visit",
    "Days since last visit",
  ];
  const csvRows = rows.map((r) => [
    r.name,
    r.contact ?? "",
    r.total,
    r.lastVisit ? formatDateOnly(r.lastVisit) : "",
    r.daysSince ?? "",
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Walk-in clients with at least {threshold} visit{threshold === 1 ? "" : "s"} and
          no membership — conversion candidates.
        </p>
        <CsvExportButton
          filename="frequent-walk-ins"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {rows.length === 0 ? (
        <ReportNoData message="No walk-ins have reached the conversion threshold." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Total visits</TableHead>
                <TableHead>Last visit</TableHead>
                <TableHead className="text-right">Days since last visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="tabular-nums">{r.contact ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {r.lastVisit ? formatDateOnly(r.lastVisit) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.daysSince ?? "—"}
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
