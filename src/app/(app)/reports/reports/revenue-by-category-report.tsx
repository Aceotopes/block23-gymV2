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

// Revenue by product category (US-8.4) — product revenue per category over the period.
// Sums POS_SALE PRODUCT line item subtotals (price snapshots, ADR-003), grouped by the
// product's category. Voids excluded.
export async function RevenueByCategoryReport({ gymId, timezone, today, sp }: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);

  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));

  const items = await prisma.transactionLineItem.findMany({
    where: {
      gymId,
      itemType: "PRODUCT",
      transaction: {
        status: "COMPLETED",
        transactionType: "POS_SALE",
        transactionDate: { gte: startUtc, lt: endUtc },
      },
    },
    select: {
      subtotal: true,
      quantity: true,
      referenceProduct: { select: { category: { select: { name: true } } } },
    },
  });

  const byCategory = new Map<string, { revenue: number; qty: number }>();
  for (const li of items) {
    const name = li.referenceProduct?.category.name ?? "Uncategorized";
    const bucket = byCategory.get(name) ?? { revenue: 0, qty: 0 };
    bucket.revenue += Number(li.subtotal);
    bucket.qty += Number(li.quantity);
    byCategory.set(name, bucket);
  }

  const rows = [...byCategory.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  const csvHeaders = ["Category", "Units / servings", "Revenue"];
  const csvRows = rows.map((r) => [r.name, r.qty, r.revenue]);
  csvRows.push(["Total", totalQty, totalRevenue]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportPeriodSelector
          basePath="/reports/revenue-by-category"
          period={period}
          from={sp.from ?? toDateInputValue(from)}
          to={sp.to ?? toDateInputValue(to)}
        />
        <CsvExportButton
          filename={`revenue-by-category-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {rows.length === 0 ? (
        <ReportNoData message="No product sales in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Units / servings</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.qty.toLocaleString("en-PH")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {totalQty.toLocaleString("en-PH")}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(totalRevenue)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
