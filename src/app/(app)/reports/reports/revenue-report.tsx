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
import {
  classifyClientTransaction,
  dailyRevenueTrend,
  revenueBySource,
  REVENUE_SOURCE_LABELS,
  type DailyRevenueRow,
  type ItemType,
} from "@/lib/revenue/revenue";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ReportPeriodSelector } from "../report-period";
import { CsvExportButton } from "../csv-export-button";
import { ReportNoData, peso, type ReportProps } from "../report-shell";

// Revenue by period & source (US-8.2). Pick a range; see total revenue split into
// Membership / Walk-in / Product (ADR-024 classification) plus a per-day breakdown.
// Voided transactions excluded; reads the unified Transaction ledger (ADR-006).
export async function RevenueReport({ gymId, timezone, today, sp }: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);

  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));

  const txns = await prisma.transaction.findMany({
    where: { gymId, status: "COMPLETED", transactionDate: { gte: startUtc, lt: endUtc } },
    select: {
      transactionType: true,
      transactionDate: true,
      totalAmount: true,
      lineItems: { select: { itemType: true } },
    },
  });

  const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const rows: DailyRevenueRow[] = txns.map((t) => ({
    day: dayKeyFmt.format(t.transactionDate),
    source:
      t.transactionType === "POS_SALE"
        ? "product"
        : classifyClientTransaction(t.lineItems.map((li) => li.itemType as ItemType)),
    amount: Number(t.totalAmount),
  }));

  const summary = revenueBySource(rows);

  const days: string[] = [];
  for (let d = from; d.getTime() <= to.getTime(); d = addDays(d, 1)) {
    days.push(toDateInputValue(d));
  }
  const trend = dailyRevenueTrend(rows, days);

  const csvHeaders = ["Date", "Membership", "Walk-in", "Product", "Total"];
  const csvRows = trend.map((r) => [
    r.date,
    r.membership,
    r.walkin,
    r.product,
    r.total,
  ]);
  csvRows.push(["Total", summary.membership, summary.walkin, summary.product, summary.total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportPeriodSelector
          basePath="/reports/revenue"
          period={period}
          from={sp.from ?? toDateInputValue(from)}
          to={sp.to ?? toDateInputValue(to)}
        />
        <CsvExportButton
          filename={`revenue-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["membership", "walkin", "product"] as const).map((s) => (
          <Card key={s}>
            <CardContent className="space-y-1 p-4">
              <p className="text-muted-foreground text-xs">{REVENUE_SOURCE_LABELS[s]}</p>
              <p className="font-mono text-xl font-semibold tabular-nums">{peso(summary[s])}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-primary/40">
          <CardContent className="space-y-1 p-4">
            <p className="text-muted-foreground text-xs">Total revenue</p>
            <p className="font-mono text-xl font-semibold tabular-nums">{peso(summary.total)}</p>
          </CardContent>
        </Card>
      </div>

      {summary.total === 0 ? (
        <ReportNoData message="No completed transactions in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Membership</TableHead>
                <TableHead className="text-right">Walk-in</TableHead>
                <TableHead className="text-right">Product</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trend.map((r) => (
                <TableRow key={r.date}>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {formatDateOnly(new Date(`${r.date}T00:00:00.000Z`))}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.membership)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.walkin)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.product)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(summary.membership)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(summary.walkin)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(summary.product)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(summary.total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
