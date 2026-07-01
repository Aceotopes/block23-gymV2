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
import { parseBestSellerSort } from "@/lib/reports/products";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/products/types";
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

// Best sellers (US-8.7) — top products by units/servings sold and by revenue over the
// period. Units sold is taken from the SALE inventory ledger (stock units — servings
// for serving-based), so container-mode sales count consistently. Default sort: units
// sold descending; the Ascending toggle surfaces the lowest performers / dead-stock
// candidates (US-8.21 is the dedicated dead-stock report). Filterable by category. Voids
// excluded (only COMPLETED POS_SALE line items).

const SORT_OPTIONS = [
  { key: "desc", label: "Top sellers" },
  { key: "asc", label: "Lowest first" },
] as const;

export async function BestSellersReport({ gymId, timezone, today, sp }: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);
  const sort = parseBestSellerSort(sp.sort);

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
      referenceProductId: true,
      referenceProduct: {
        select: { name: true, productType: true, category: { select: { name: true } } },
      },
      inventoryMovements: {
        where: { type: "SALE" },
        select: { quantityDelta: true },
      },
    },
  });

  type Agg = {
    name: string;
    category: string;
    type: ProductType | null;
    units: number;
    revenue: number;
  };
  const byProduct = new Map<string, Agg>();
  for (const li of items) {
    if (!li.referenceProductId || !li.referenceProduct) continue;
    const units = -li.inventoryMovements.reduce((s, m) => s + Number(m.quantityDelta), 0);
    const agg = byProduct.get(li.referenceProductId) ?? {
      name: li.referenceProduct.name,
      category: li.referenceProduct.category.name,
      type: li.referenceProduct.productType,
      units: 0,
      revenue: 0,
    };
    agg.units += units;
    agg.revenue += Number(li.subtotal);
    byProduct.set(li.referenceProductId, agg);
  }

  const rows = [...byProduct.values()].sort((a, b) =>
    sort === "asc"
      ? a.units - b.units || a.revenue - b.revenue
      : b.units - a.units || b.revenue - a.revenue,
  );

  const totalUnits = rows.reduce((s, r) => s + r.units, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  const csvHeaders = ["Product", "Category", "Type", "Units / servings sold", "Revenue"];
  const csvRows: (string | number)[][] = rows.map((r) => [
    r.name,
    r.category,
    r.type ? PRODUCT_TYPE_LABELS[r.type] : "",
    r.units,
    r.revenue,
  ]);
  csvRows.push(["Total", "", "", totalUnits, totalRevenue]);

  const categoryOptions = [
    { key: "all", label: "All categories" },
    ...categories.map((c) => ({ key: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ReportPeriodSelector
            basePath="/reports/best-sellers"
            period={period}
            from={sp.from ?? toDateInputValue(from)}
            to={sp.to ?? toDateInputValue(to)}
            extra={{ category: categoryFilter, sort }}
          />
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <ReportSegmentFilter
              param="category"
              value={categoryFilter}
              options={categoryOptions}
              label="Category"
            />
            <ReportSegmentFilter
              param="sort"
              value={sort}
              options={SORT_OPTIONS}
              label="Sort"
            />
          </div>
        </div>
        <CsvExportButton
          filename={`best-sellers-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
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
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Units / servings sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {r.type ? PRODUCT_TYPE_LABELS[r.type] : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.units.toLocaleString("en-PH")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(r.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium" colSpan={3}>
                  Total
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {totalUnits.toLocaleString("en-PH")}
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
