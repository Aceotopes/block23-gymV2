import { prisma } from "@/lib/prisma";
import {
  gymDayStartUtc,
  addDays,
  toDateInputValue,
  parseDateOnly,
  formatDateOnly,
} from "@/lib/dates";
import {
  isReportPeriod,
  reportRange,
  type ReportPeriod,
} from "@/lib/reports/period";
import { deriveConversion } from "@/lib/reports/conversion";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportPeriodSelector } from "../report-period";
import { CsvExportButton } from "../csv-export-button";
import { ReportNoData, peso, type ReportProps } from "../report-shell";

// Converted walk-ins (US-8.22) — clients who became members and had ≥1 WALK_IN
// attendance predating their earliest Membership.created_at (ADR-020 — the same
// derivation used by US-8.8 and Attendance Analytics). Filters to conversions whose
// conversion date (earliest membership.created_at) falls in the selected period. The
// earliest membership supplies the plan + price paid (snapshot, ADR-003).
export async function ConvertedWalkInsReport({
  gymId,
  timezone,
  today,
  sp,
}: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);
  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));

  const [clients, walkIns] = await Promise.all([
    prisma.client.findMany({
      where: { gymId, deletedAt: null, memberships: { some: { cancelledAt: null } } },
      select: {
        id: true,
        fullName: true,
        memberships: {
          where: { cancelledAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            createdAt: true,
            pricePaid: true,
            membershipPlan: { select: { name: true } },
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { gymId, visitType: "WALK_IN" },
      select: { clientId: true, visitDate: true },
    }),
  ]);

  const walkInMap = new Map<string, Date[]>();
  for (const w of walkIns) {
    const list = walkInMap.get(w.clientId) ?? [];
    list.push(w.visitDate);
    walkInMap.set(w.clientId, list);
  }

  const dateInTz = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  type Row = {
    name: string;
    firstWalkIn: Date;
    visitsBefore: number;
    conversionDate: Date;
    daysToConvert: number;
    plan: string;
    pricePaid: number;
  };
  const rows: Row[] = [];
  for (const c of clients) {
    const earliest = c.memberships[0]; // ordered by createdAt asc
    if (!earliest) continue;
    const conv = deriveConversion({
      earliestMembershipCreatedAt: earliest.createdAt,
      walkInVisitDates: walkInMap.get(c.id) ?? [],
    });
    if (!conv.converted || !conv.conversionDate || !conv.firstWalkInDate) continue;
    // Conversion date must fall within the selected period.
    if (
      conv.conversionDate.getTime() < startUtc.getTime() ||
      conv.conversionDate.getTime() >= endUtc.getTime()
    ) {
      continue;
    }
    rows.push({
      name: c.fullName,
      firstWalkIn: conv.firstWalkInDate,
      visitsBefore: conv.walkInsBeforeConversion,
      conversionDate: conv.conversionDate,
      daysToConvert: conv.daysToConvert ?? 0,
      plan: earliest.membershipPlan?.name ?? "Custom (ad-hoc)",
      pricePaid: Number(earliest.pricePaid),
    });
  }
  rows.sort((a, b) => b.conversionDate.getTime() - a.conversionDate.getTime());

  const count = rows.length;
  const avgVisits = count
    ? rows.reduce((s, r) => s + r.visitsBefore, 0) / count
    : 0;
  const avgDays = count
    ? rows.reduce((s, r) => s + r.daysToConvert, 0) / count
    : 0;

  const csvHeaders = [
    "Client",
    "First walk-in",
    "Walk-in visits before conversion",
    "Conversion date",
    "Days to convert",
    "Plan",
    "Price paid",
  ];
  const csvRows: (string | number)[][] = rows.map((r) => [
    r.name,
    formatDateOnly(r.firstWalkIn),
    r.visitsBefore,
    dateInTz.format(r.conversionDate),
    r.daysToConvert,
    r.plan,
    r.pricePaid,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportPeriodSelector
          basePath="/reports/converted-walk-ins"
          period={period}
          from={sp.from ?? toDateInputValue(from)}
          to={sp.to ?? toDateInputValue(to)}
        />
        <CsvExportButton
          filename={`converted-walk-ins-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {count === 0 ? (
        <ReportNoData message="No conversions recorded in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>First walk-in</TableHead>
                <TableHead className="text-right">Visits before</TableHead>
                <TableHead>Conversion date</TableHead>
                <TableHead className="text-right">Days to convert</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Price paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {formatDateOnly(r.firstWalkIn)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.visitsBefore}</TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {dateInTz.format(r.conversionDate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.daysToConvert}</TableCell>
                  <TableCell>{r.plan}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.pricePaid)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">
                  {count} conversion{count === 1 ? "" : "s"}
                </TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">
                  {avgVisits.toFixed(1)} avg
                </TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">
                  {avgDays.toFixed(1)} avg
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
