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
import { summarizeCollections } from "@/lib/payments/collections";
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

// Revenue by payment method (US-8.3) — Cash / GCash / Card / Other over the selected
// period, spanning both CLIENT_TRANSACTION and POS_SALE (ADR-006). Reuses
// `summarizeCollections` (the same aggregation as End-of-Day Collections). Voids excluded.
export async function RevenueByMethodReport({ gymId, timezone, today, sp }: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);

  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));

  const txns = await prisma.transaction.findMany({
    where: { gymId, status: "COMPLETED", transactionDate: { gte: startUtc, lt: endUtc } },
    select: { paymentMethod: true, totalAmount: true },
  });

  const summary = summarizeCollections(
    txns.map((t) => ({ paymentMethod: t.paymentMethod, totalAmount: Number(t.totalAmount) })),
  );

  const csvHeaders = ["Payment method", "Transactions", "Total"];
  const csvRows = summary.lines.map((l) => [l.label, l.count, l.total]);
  csvRows.push(["Grand total", summary.grandCount, summary.grandTotal]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportPeriodSelector
          basePath="/reports/revenue-by-method"
          period={period}
          from={sp.from ?? toDateInputValue(from)}
          to={sp.to ?? toDateInputValue(to)}
        />
        <CsvExportButton
          filename={`revenue-by-method-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {summary.grandCount === 0 ? (
        <ReportNoData message="No completed transactions in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment method</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.lines.map((l) => (
                <TableRow key={l.method}>
                  <TableCell className="font-medium">{l.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.count}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(l.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Grand total</TableCell>
                <TableCell className="text-right tabular-nums">{summary.grandCount}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(summary.grandTotal)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
