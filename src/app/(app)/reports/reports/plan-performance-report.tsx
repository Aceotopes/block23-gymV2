import { prisma } from "@/lib/prisma";
import {
  gymDayStartUtc,
  addDays,
  toDateInputValue,
  parseDateOnly,
} from "@/lib/dates";
import {
  isReportPeriod,
  reportRange,
  type ReportPeriod,
} from "@/lib/reports/period";
import { durationDaysLabel } from "@/lib/memberships/duration";
import { Badge } from "@/components/ui/badge";
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
import { ReportSegmentFilter } from "../report-filter";
import { CsvExportButton } from "../csv-export-button";
import { ReportNoData, peso, type ReportProps } from "../report-shell";

// Membership plan performance (US-8.17) — per plan: count sold, total revenue
// (SUM price_paid), and average price paid over the period. Active plans always show
// (zero counts included); inactive/retired plans show only when they had sales in the
// period. Ad-hoc (null-plan) memberships roll up into a "Custom (ad-hoc)" row. Average
// price reflects the price snapshot (ADR-003), which may differ from the current default.

const STATUS_OPTIONS = [
  { key: "both", label: "Both" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

export async function PlanPerformanceReport({
  gymId,
  timezone,
  today,
  sp,
}: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);
  const statusFilter =
    sp.status === "active" || sp.status === "inactive" ? sp.status : "both";

  const [plans, memberships] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { gymId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        durationDays: true,
        defaultPrice: true,
        isActive: true,
      },
    }),
    prisma.membership.findMany({
      where: {
        gymId,
        cancelledAt: null,
        createdAt: {
          gte: gymDayStartUtc(timezone, from),
          lt: gymDayStartUtc(timezone, addDays(to, 1)),
        },
      },
      select: { membershipPlanId: true, pricePaid: true },
    }),
  ]);

  const sold = new Map<string, { count: number; revenue: number }>();
  let adhocCount = 0;
  let adhocRevenue = 0;
  for (const m of memberships) {
    const amount = Number(m.pricePaid);
    if (m.membershipPlanId === null) {
      adhocCount += 1;
      adhocRevenue += amount;
      continue;
    }
    const b = sold.get(m.membershipPlanId) ?? { count: 0, revenue: 0 };
    b.count += 1;
    b.revenue += amount;
    sold.set(m.membershipPlanId, b);
  }

  type Row = {
    name: string;
    duration: string;
    defaultPrice: number | null;
    count: number;
    revenue: number;
    status: "Active" | "Inactive" | null;
  };
  const rows: Row[] = [];
  for (const p of plans) {
    const s = sold.get(p.id) ?? { count: 0, revenue: 0 };
    // Active plans always shown; inactive plans only when they sold in the period.
    if (!p.isActive && s.count === 0) continue;
    if (statusFilter === "active" && !p.isActive) continue;
    if (statusFilter === "inactive" && p.isActive) continue;
    rows.push({
      name: p.name,
      duration: durationDaysLabel(p.durationDays),
      defaultPrice: Number(p.defaultPrice),
      count: s.count,
      revenue: s.revenue,
      status: p.isActive ? "Active" : "Inactive",
    });
  }
  if (adhocCount > 0) {
    rows.push({
      name: "Custom (ad-hoc)",
      duration: "—",
      defaultPrice: null,
      count: adhocCount,
      revenue: adhocRevenue,
      status: null,
    });
  }

  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  const avg = (r: Row) => (r.count > 0 ? r.revenue / r.count : 0);

  const csvHeaders = [
    "Plan",
    "Duration",
    "Current default price",
    "Status",
    "Sold",
    "Total revenue",
    "Average price paid",
  ];
  const csvRows = rows.map((r) => [
    r.name,
    r.duration,
    r.defaultPrice === null ? "" : r.defaultPrice,
    r.status ?? "",
    r.count,
    r.revenue,
    r.count > 0 ? avg(r) : "",
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ReportPeriodSelector
            basePath="/reports/plan-performance"
            period={period}
            from={sp.from ?? toDateInputValue(from)}
            to={sp.to ?? toDateInputValue(to)}
            extra={{ status: statusFilter }}
          />
          <ReportSegmentFilter
            param="status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            label="Plan status"
          />
        </div>
        <CsvExportButton
          filename={`plan-performance-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      <p className="text-muted-foreground text-sm">
        Average price paid reflects actual amounts collected per the price-snapshot rule
        (ADR-003). Comparison to the current default price may not reflect the default at
        time of sale if it was later edited.
      </p>

      {rows.length === 0 ? (
        <ReportNoData message="No plans to show for this period and filter." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Current default price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Total revenue</TableHead>
                <TableHead className="text-right">Avg price paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} className={r.count === 0 ? "text-muted-foreground" : ""}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.duration}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {r.defaultPrice === null ? "—" : peso(r.defaultPrice)}
                  </TableCell>
                  <TableCell>
                    {r.status ? (
                      <Badge variant="outline">{r.status}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.revenue)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {r.count > 0 ? peso(avg(r)) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium" colSpan={4}>
                  Total
                </TableCell>
                <TableCell className="text-right tabular-nums">{totalCount}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(totalRevenue)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {totalCount > 0 ? peso(totalRevenue / totalCount) : "—"}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
