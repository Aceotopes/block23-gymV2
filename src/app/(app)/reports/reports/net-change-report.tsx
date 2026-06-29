import { prisma } from "@/lib/prisma";
import {
  toDateInputValue,
  parseDateOnly,
} from "@/lib/dates";
import {
  isReportPeriod,
  reportRange,
  type ReportPeriod,
} from "@/lib/reports/period";
import { isRenewal, monthBuckets } from "@/lib/reports/membership";
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

// Membership net change (US-8.19) — per month: new + renewals − expired, with the
// cumulative active-member count at each month's end. Default range: the last 12 months.
// Positive net change is green, negative red, zero neutral. Cancelled memberships
// (ADR-041) are excluded everywhere. Expired = memberships whose `end_date` fell in the
// month; cumulative active = distinct clients with an in-effect membership at month end.
export async function NetChangeReport({ gymId, timezone, today, sp }: ReportProps) {
  // Default to the trailing 12 months (custom range), per US-8.19.
  const defaultFrom = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1),
  );
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "custom";
  const customFrom = sp.from ? parseDateOnly(sp.from) : defaultFrom;
  const customTo = sp.to ? parseDateOnly(sp.to) : today;
  const { from, to } = reportRange(period, today, customFrom, customTo);

  const memberships = await prisma.membership.findMany({
    where: { gymId, cancelledAt: null },
    select: {
      clientId: true,
      createdAt: true,
      startDate: true,
      endDate: true,
      renewedFromMembershipId: true,
    },
  });

  const buckets = monthBuckets(from, to);
  const monthKeyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  });

  const rows = buckets.map((b) => {
    let newCount = 0;
    let renewalCount = 0;
    let expired = 0;
    const activeClients = new Set<string>();
    const monthEnd = b.to.getTime();
    for (const m of memberships) {
      // New / renewal — by gym-local creation month.
      if (monthKeyFmt.format(m.createdAt) === b.key) {
        if (isRenewal(m)) renewalCount += 1;
        else newCount += 1;
      }
      // Expired — end_date falling within the calendar month.
      if (
        m.endDate.getTime() >= b.from.getTime() &&
        m.endDate.getTime() <= monthEnd
      ) {
        expired += 1;
      }
      // In effect at month end → contributes to cumulative active.
      if (
        m.startDate.getTime() <= monthEnd &&
        monthEnd <= m.endDate.getTime()
      ) {
        activeClients.add(m.clientId);
      }
    }
    return {
      label: b.label,
      newCount,
      renewalCount,
      expired,
      net: newCount + renewalCount - expired,
      cumulativeActive: activeClients.size,
    };
  });

  const csvHeaders = [
    "Month",
    "New",
    "Renewals",
    "Expired",
    "Net change",
    "Cumulative active",
  ];
  const csvRows = rows.map((r) => [
    r.label,
    r.newCount,
    r.renewalCount,
    r.expired,
    r.net,
    r.cumulativeActive,
  ]);

  const netClass = (n: number) =>
    n > 0 ? "text-success-on" : n < 0 ? "text-danger-on" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportPeriodSelector
          basePath="/reports/net-change"
          period={period}
          from={sp.from ?? toDateInputValue(from)}
          to={sp.to ?? toDateInputValue(to)}
        />
        <CsvExportButton
          filename={`membership-net-change-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {rows.length === 0 ? (
        <ReportNoData />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Renewals</TableHead>
                <TableHead className="text-right">Expired</TableHead>
                <TableHead className="text-right">Net change</TableHead>
                <TableHead className="text-right">Cumulative active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="whitespace-nowrap">{r.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.newCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.renewalCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.expired}</TableCell>
                  <TableCell className={`text-right font-medium tabular-nums ${netClass(r.net)}`}>
                    {r.net > 0 ? `+${r.net}` : r.net}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.cumulativeActive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
