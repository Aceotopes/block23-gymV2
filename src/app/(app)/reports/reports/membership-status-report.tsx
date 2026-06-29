import { prisma } from "@/lib/prisma";
import { formatDateOnly } from "@/lib/dates";
import { deriveClient, type MemberStatus } from "@/lib/clients/derive";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportSegmentFilter } from "../report-filter";
import { CsvExportButton } from "../csv-export-button";
import { ReportNoData, type ReportProps } from "../report-shell";

// Membership status lists (US-8.6) — a point-in-time snapshot (as of today, not a
// period) of MEMBER clients by derived status. Status is derived centrally via
// `deriveClient` (ADR-002/040) so it agrees with the Client List chips and Dashboard.
// Cancelled memberships are excluded by the derivation (ADR-041).

const STATUS_OPTIONS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring-soon", label: "Expiring soon" },
  { key: "upcoming", label: "Upcoming" },
  { key: "expired", label: "Expired" },
] as const;

const FILTER_TO_STATUS: Record<string, MemberStatus> = {
  active: "ACTIVE",
  "expiring-soon": "EXPIRING_SOON",
  upcoming: "UPCOMING",
  expired: "EXPIRED",
};

export async function MembershipStatusReport({
  gymId,
  today,
  thresholds,
  sp,
}: ReportProps) {
  const status =
    sp.status && STATUS_OPTIONS.some((o) => o.key === sp.status)
      ? sp.status
      : "all";

  const [clients, lastVisits] = await Promise.all([
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
      _max: { visitDate: true },
    }),
  ]);

  const lastVisitMap = new Map(
    lastVisits.map((a) => [a.clientId, (a._max.visitDate as Date | null) ?? null]),
  );

  type Row = {
    name: string;
    status: MemberStatus;
    expiry: Date | null;
    daysUntilExpiry: number | null;
    lastVisit: Date | null;
  };
  const rows: Row[] = [];
  for (const c of clients) {
    const d = deriveClient({
      memberships: c.memberships,
      lastVisitDate: lastVisitMap.get(c.id) ?? null,
      totalVisits: 0,
      today,
      thresholds,
    });
    if (d.clientType !== "MEMBER" || d.memberStatus === null) continue;
    rows.push({
      name: c.fullName,
      status: d.memberStatus,
      expiry: d.membershipExpiry,
      daysUntilExpiry: d.daysUntilExpiry,
      lastVisit: d.lastVisitDate,
    });
  }

  const filtered = (
    status === "all" ? rows : rows.filter((r) => r.status === FILTER_TO_STATUS[status])
  ).sort(
    (a, b) =>
      (a.expiry?.getTime() ?? Infinity) - (b.expiry?.getTime() ?? Infinity) ||
      a.name.localeCompare(b.name),
  );

  const STATUS_TEXT: Record<MemberStatus, string> = {
    ACTIVE: "Active",
    EXPIRING_SOON: "Expiring soon",
    UPCOMING: "Upcoming",
    EXPIRED: "Expired",
  };

  const csvHeaders = ["Member", "Status", "Expiry", "Days until expiry", "Last visit"];
  const csvRows = filtered.map((r) => [
    r.name,
    STATUS_TEXT[r.status],
    r.expiry ? formatDateOnly(r.expiry) : "",
    r.daysUntilExpiry ?? "",
    r.lastVisit ? formatDateOnly(r.lastVisit) : "",
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportSegmentFilter param="status" value={status} options={STATUS_OPTIONS} />
        <CsvExportButton
          filename={`membership-status-${status}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {filtered.length === 0 ? (
        <ReportNoData message="No members match this status." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Days until expiry</TableHead>
                <TableHead>Last visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {r.expiry ? formatDateOnly(r.expiry) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.daysUntilExpiry ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {r.lastVisit ? formatDateOnly(r.lastVisit) : "Never"}
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
