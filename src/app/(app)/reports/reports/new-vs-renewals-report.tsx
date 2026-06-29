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
import {
  isRenewal,
  renewalRate,
  monthBuckets,
} from "@/lib/reports/membership";
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

// New vs. renewals (US-8.16) — new memberships (`renewed_from_membership_id IS NULL`)
// vs. renewals (`IS NOT NULL`) per month, with renewal rate %. New/renewal is a
// structural property of the schema, never a heuristic (MODULE-SPECS §8). Filterable by
// plan. Cancelled memberships (ADR-041) are excluded; revenue uses the price snapshot.
function pct(p: number | null): string {
  return p === null ? "—" : `${Math.round(p)}%`;
}

export async function NewVsRenewalsReport({
  gymId,
  timezone,
  today,
  sp,
}: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "year";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);

  const plans = await prisma.membershipPlan.findMany({
    where: { gymId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const planFilter = sp.plan ?? "all";
  const planWhere =
    planFilter === "all"
      ? {}
      : planFilter === "custom"
        ? { membershipPlanId: null }
        : { membershipPlanId: planFilter };

  const memberships = await prisma.membership.findMany({
    where: {
      gymId,
      cancelledAt: null,
      createdAt: {
        gte: gymDayStartUtc(timezone, from),
        lt: gymDayStartUtc(timezone, addDays(to, 1)),
      },
      ...planWhere,
    },
    select: {
      createdAt: true,
      renewedFromMembershipId: true,
      pricePaid: true,
    },
  });

  const buckets = monthBuckets(from, to);
  const monthKeyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  });
  type Agg = {
    newCount: number;
    renewalCount: number;
    newRevenue: number;
    renewalRevenue: number;
  };
  const byMonth = new Map<string, Agg>(
    buckets.map((b) => [
      b.key,
      { newCount: 0, renewalCount: 0, newRevenue: 0, renewalRevenue: 0 },
    ]),
  );
  for (const m of memberships) {
    const key = monthKeyFmt.format(m.createdAt); // YYYY-MM
    const agg = byMonth.get(key);
    if (!agg) continue;
    const amount = Number(m.pricePaid);
    if (isRenewal(m)) {
      agg.renewalCount += 1;
      agg.renewalRevenue += amount;
    } else {
      agg.newCount += 1;
      agg.newRevenue += amount;
    }
  }

  const rows = buckets.map((b) => {
    const a = byMonth.get(b.key)!;
    return {
      label: b.label,
      ...a,
      totalCount: a.newCount + a.renewalCount,
      totalRevenue: a.newRevenue + a.renewalRevenue,
      rate: renewalRate(a.newCount, a.renewalCount),
    };
  });

  const totals = rows.reduce(
    (t, r) => ({
      newCount: t.newCount + r.newCount,
      renewalCount: t.renewalCount + r.renewalCount,
      newRevenue: t.newRevenue + r.newRevenue,
      renewalRevenue: t.renewalRevenue + r.renewalRevenue,
    }),
    { newCount: 0, renewalCount: 0, newRevenue: 0, renewalRevenue: 0 },
  );
  const totalCount = totals.newCount + totals.renewalCount;
  const totalRevenue = totals.newRevenue + totals.renewalRevenue;
  const blendedRate = renewalRate(totals.newCount, totals.renewalCount);

  const planOptions = [
    { key: "all", label: "All plans" },
    ...plans.map((p) => ({ key: p.id, label: p.name })),
    { key: "custom", label: "Custom (ad-hoc)" },
  ];

  const csvHeaders = [
    "Month",
    "New",
    "Renewals",
    "Total",
    "New revenue",
    "Renewal revenue",
    "Total revenue",
    "Renewal rate",
  ];
  const csvRows: (string | number)[][] = rows.map((r) => [
    r.label,
    r.newCount,
    r.renewalCount,
    r.totalCount,
    r.newRevenue,
    r.renewalRevenue,
    r.totalRevenue,
    pct(r.rate),
  ]);
  csvRows.push([
    "Total",
    totals.newCount,
    totals.renewalCount,
    totalCount,
    totals.newRevenue,
    totals.renewalRevenue,
    totalRevenue,
    pct(blendedRate),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ReportPeriodSelector
            basePath="/reports/new-vs-renewals"
            period={period}
            from={sp.from ?? toDateInputValue(from)}
            to={sp.to ?? toDateInputValue(to)}
            extra={{ plan: planFilter }}
          />
          <ReportSegmentFilter param="plan" value={planFilter} options={planOptions} />
        </div>
        <CsvExportButton
          filename={`new-vs-renewals-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {totalCount === 0 ? (
        <ReportNoData message="No memberships sold in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Renewals</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">New revenue</TableHead>
                <TableHead className="text-right">Renewal revenue</TableHead>
                <TableHead className="text-right">Total revenue</TableHead>
                <TableHead className="text-right">Renewal rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="whitespace-nowrap">{r.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.newCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.renewalCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.totalCount}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.newRevenue)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.renewalRevenue)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.totalRevenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(r.rate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right tabular-nums">{totals.newCount}</TableCell>
                <TableCell className="text-right tabular-nums">{totals.renewalCount}</TableCell>
                <TableCell className="text-right tabular-nums">{totalCount}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(totals.newRevenue)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(totals.renewalRevenue)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(totalRevenue)}</TableCell>
                <TableCell className="text-right tabular-nums">{pct(blendedRate)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
