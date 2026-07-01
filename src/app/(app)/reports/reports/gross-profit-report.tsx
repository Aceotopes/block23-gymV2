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
import { grossProfit } from "@/lib/reports/products";
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

// Gross profit (US-8.12) — per product over the period: units/servings sold, revenue
// (Σ subtotal — price snapshot, ADR-003), COGS (Σ cost_price_snapshot × stock units —
// cost snapshot, ADR-026), gross profit (revenue − COGS) and margin %. Units + COGS are
// computed from the SALE inventory ledger so container-mode sales count consistently.
// Line items with a null cost snapshot are excluded from COGS and counted so the owner
// knows the margin may be understated. Voids excluded.

function pct(p: number | null): string {
  return p === null ? "—" : `${p.toFixed(1)}%`;
}

export async function GrossProfitReport({ gymId, timezone, today, sp }: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);

  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));

  const categories = await prisma.productCategory.findMany({
    where: { gymId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const categoryFilter = sp.category ?? "all";

  const items = await prisma.transactionLineItem.findMany({
    where: {
      gymId,
      itemType: "PRODUCT",
      transaction: {
        status: "COMPLETED",
        transactionType: "POS_SALE",
        transactionDate: { gte: startUtc, lt: endUtc },
      },
      ...(categoryFilter === "all"
        ? {}
        : { referenceProduct: { is: { categoryId: categoryFilter } } }),
    },
    select: {
      subtotal: true,
      costPriceSnapshot: true,
      referenceProductId: true,
      referenceProduct: { select: { name: true, category: { select: { name: true } } } },
      inventoryMovements: {
        where: { type: "SALE" },
        select: { quantityDelta: true },
      },
    },
  });

  type Agg = {
    name: string;
    category: string;
    units: number;
    revenue: number;
    cogs: number;
    nullCostLines: number;
  };
  const byProduct = new Map<string, Agg>();
  let totalNullCostLines = 0;
  let totalSaleLines = 0;
  for (const li of items) {
    if (!li.referenceProductId || !li.referenceProduct) continue;
    totalSaleLines += 1;
    const units = -li.inventoryMovements.reduce((s, m) => s + Number(m.quantityDelta), 0);
    const agg = byProduct.get(li.referenceProductId) ?? {
      name: li.referenceProduct.name,
      category: li.referenceProduct.category.name,
      units: 0,
      revenue: 0,
      cogs: 0,
      nullCostLines: 0,
    };
    agg.units += units;
    agg.revenue += Number(li.subtotal);
    if (li.costPriceSnapshot === null) {
      agg.nullCostLines += 1;
      totalNullCostLines += 1;
    } else {
      agg.cogs += Number(li.costPriceSnapshot) * units;
    }
    byProduct.set(li.referenceProductId, agg);
  }

  const rows = [...byProduct.values()]
    .map((a) => ({ ...a, ...grossProfit(a.revenue, a.cogs) }))
    .sort((a, b) => b.profit - a.profit);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCogs = rows.reduce((s, r) => s + r.cogs, 0);
  const blended = grossProfit(totalRevenue, totalCogs);
  const allNullCost = totalSaleLines > 0 && totalNullCostLines === totalSaleLines;

  const csvHeaders = [
    "Product",
    "Category",
    "Units / servings sold",
    "Revenue",
    "COGS",
    "Gross profit",
    "Margin %",
  ];
  const csvRows: (string | number)[][] = rows.map((r) => [
    r.name,
    r.category,
    r.units,
    r.revenue,
    r.cogs,
    r.profit,
    r.marginPercent === null ? "" : r.marginPercent.toFixed(1),
  ]);
  csvRows.push([
    "Total",
    "",
    "",
    totalRevenue,
    totalCogs,
    blended.profit,
    blended.marginPercent === null ? "" : blended.marginPercent.toFixed(1),
  ]);

  const categoryOptions = [
    { key: "all", label: "All categories" },
    ...categories.map((c) => ({ key: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ReportPeriodSelector
            basePath="/reports/gross-profit"
            period={period}
            from={sp.from ?? toDateInputValue(from)}
            to={sp.to ?? toDateInputValue(to)}
            extra={{ category: categoryFilter }}
          />
          <ReportSegmentFilter
            param="category"
            value={categoryFilter}
            options={categoryOptions}
            label="Category"
          />
        </div>
        <CsvExportButton
          filename={`gross-profit-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      <p className="text-muted-foreground text-sm">
        COGS uses the cost-price snapshot recorded at the time of each sale (ADR-026), so
        historical gross profit stays correct even if a product&rsquo;s cost price later
        changes.
      </p>

      {allNullCost ? (
        <div className="border-warning-on/30 bg-warning-on/10 text-warning-on rounded-md border px-4 py-3 text-sm">
          No cost data available for this period — gross profit and margin cannot be
          computed. Set cost prices on products to enable profitability tracking.
        </div>
      ) : totalNullCostLines > 0 ? (
        <div className="border-warning-on/30 bg-warning-on/10 text-warning-on rounded-md border px-4 py-3 text-sm">
          {totalNullCostLines} sale{totalNullCostLines === 1 ? "" : "s"} without cost data
          — margin may be understated.
        </div>
      ) : null}

      {rows.length === 0 ? (
        <ReportNoData message="No product sales in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Units / servings</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">COGS</TableHead>
                <TableHead className="text-right">Gross profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {r.name}
                    {r.nullCostLines > 0 ? (
                      <span className="text-warning-on ml-1" title="Some sales lack cost data">
                        *
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.units.toLocaleString("en-PH")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.revenue)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.cogs)}</TableCell>
                  <TableCell
                    className={
                      r.profit < 0
                        ? "text-danger-on text-right font-mono tabular-nums"
                        : "text-right font-mono tabular-nums"
                    }
                  >
                    {peso(r.profit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{pct(r.marginPercent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium" colSpan={3}>
                  Total
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(totalRevenue)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(totalCogs)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(blended.profit)}</TableCell>
                <TableCell className="text-right tabular-nums">{pct(blended.marginPercent)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
