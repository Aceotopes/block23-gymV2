import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import {
  gymDayStartUtc,
  addDays,
  toDateInputValue,
  parseDateOnly,
  formatDateTimeInTz,
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
import { ReportSegmentFilter } from "../report-filter";
import { CsvExportButton } from "../csv-export-button";
import { ReportNoData, peso, type ReportProps } from "../report-shell";

// Restock cost (US-8.18) — inventory spend per product per period, from
// InventoryTransaction PURCHASE entries (Flow 9). Detail rows per restock event with a
// per-product subtotal and a grand total. Restock events with a null total_restock_cost
// are listed with "—" and excluded from all totals; the excluded count is noted so the
// owner knows the spend figure may be understated. Filterable by category.

function num(value: number): string {
  return value.toLocaleString("en-PH");
}

export async function RestockCostReport({ gymId, timezone, today, sp }: ReportProps) {
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

  const records = await prisma.inventoryTransaction.findMany({
    where: {
      gymId,
      type: "PURCHASE",
      createdAt: { gte: startUtc, lt: endUtc },
      ...(categoryFilter === "all" ? {} : { product: { is: { categoryId: categoryFilter } } }),
    },
    orderBy: [{ productId: "asc" }, { createdAt: "asc" }],
    select: {
      createdAt: true,
      quantityDelta: true,
      totalRestockCost: true,
      productId: true,
      product: { select: { name: true } },
    },
  });

  type Detail = {
    name: string;
    date: Date;
    quantity: number;
    cost: number | null;
  };
  type Group = { name: string; details: Detail[]; quantity: number; spend: number };
  const groups = new Map<string, Group>();
  let grandSpend = 0;
  let excludedCount = 0;

  for (const r of records) {
    const cost = r.totalRestockCost === null ? null : Number(r.totalRestockCost);
    const qty = Number(r.quantityDelta);
    const g = groups.get(r.productId) ?? {
      name: r.product.name,
      details: [],
      quantity: 0,
      spend: 0,
    };
    g.details.push({ name: r.product.name, date: r.createdAt, quantity: qty, cost });
    g.quantity += qty;
    if (cost === null) {
      excludedCount += 1;
    } else {
      g.spend += cost;
      grandSpend += cost;
    }
    groups.set(r.productId, g);
  }

  const orderedGroups = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));

  const csvHeaders = ["Product", "Restock date", "Stock added", "Total cost"];
  const csvRows: (string | number)[][] = [];
  for (const g of orderedGroups) {
    for (const d of g.details) {
      csvRows.push([
        d.name,
        formatDateTimeInTz(d.date, timezone),
        d.quantity,
        d.cost === null ? "" : d.cost,
      ]);
    }
    csvRows.push([`${g.name} — subtotal`, "", g.quantity, g.spend]);
  }
  csvRows.push(["Grand total", "", "", grandSpend]);

  const categoryOptions = [
    { key: "all", label: "All categories" },
    ...categories.map((c) => ({ key: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ReportPeriodSelector
            basePath="/reports/restock-cost"
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
          filename={`restock-cost-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {excludedCount > 0 ? (
        <div className="border-warning-on/30 bg-warning-on/10 text-warning-on rounded-md border px-4 py-3 text-sm">
          {excludedCount} restock event{excludedCount === 1 ? "" : "s"} without cost
          recorded — excluded from totals. Spend figures may be understated.
        </div>
      ) : null}

      {records.length === 0 ? (
        <ReportNoData message="No restocks in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Restock date</TableHead>
                <TableHead className="text-right">Stock added</TableHead>
                <TableHead className="text-right">Total cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedGroups.map((g) => (
                <Fragment key={g.name}>
                  {g.details.map((d, i) => (
                    <TableRow key={`${g.name}-${i}`}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {formatDateTimeInTz(d.date, timezone)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{num(d.quantity)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {d.cost === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          peso(d.cost)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow key={`${g.name}-subtotal`} className="bg-muted/40">
                    <TableCell className="font-medium" colSpan={2}>
                      {g.name} — subtotal
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{num(g.quantity)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{peso(g.spend)}</TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium" colSpan={3}>
                  Grand total
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(grandSpend)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
