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
  ADJUSTMENT_REASON_LABELS,
  type AdjustmentReasonCategory,
} from "@/lib/inventory/adjustment";
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
import { ReportNoData, type ReportProps } from "../report-shell";

// Inventory usage (US-8.9) — per product over the range: units/servings sold,
// restocked, net adjusted, and the resulting stock change, drawn from the
// InventoryTransaction ledger (ADR-004). A shrinkage section sums negative ADJUSTMENT
// quantity per product broken down by adjustment_reason_category (MODULE-SPECS §8 —
// shrinkage is ledger-derived, ADJUSTMENT entries only). FORCED_SALE markers (qty 0)
// and void-reversal entries (positive, no reason) never count as shrinkage.

function num(value: number): string {
  return value.toLocaleString("en-PH");
}

function signed(value: number): string {
  return value > 0 ? `+${num(value)}` : num(value);
}

export async function InventoryUsageReport({ gymId, timezone, today, sp }: ReportProps) {
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
      createdAt: { gte: startUtc, lt: endUtc },
      ...(categoryFilter === "all" ? {} : { product: { is: { categoryId: categoryFilter } } }),
    },
    select: {
      type: true,
      quantityDelta: true,
      adjustmentReasonCategory: true,
      productId: true,
      product: { select: { name: true } },
    },
  });

  type Usage = {
    name: string;
    sold: number;
    restocked: number;
    adjusted: number;
    shrinkage: number;
  };
  const byProduct = new Map<string, Usage>();
  // product → reason → shrinkage qty
  const shrinkByProduct = new Map<string, Map<string, number>>();

  for (const r of records) {
    const delta = Number(r.quantityDelta);
    const u = byProduct.get(r.productId) ?? {
      name: r.product.name,
      sold: 0,
      restocked: 0,
      adjusted: 0,
      shrinkage: 0,
    };
    if (r.type === "SALE") {
      u.sold += -delta;
    } else if (r.type === "PURCHASE") {
      u.restocked += delta;
    } else {
      // ADJUSTMENT
      u.adjusted += delta;
      if (delta < 0) {
        const lost = -delta;
        u.shrinkage += lost;
        const reasonKey = r.adjustmentReasonCategory ?? "UNSPECIFIED";
        const m = shrinkByProduct.get(r.productId) ?? new Map<string, number>();
        m.set(reasonKey, (m.get(reasonKey) ?? 0) + lost);
        shrinkByProduct.set(r.productId, m);
      }
    }
    byProduct.set(r.productId, u);
  }

  const rows = [...byProduct.values()]
    .map((u) => ({ ...u, stockChange: u.restocked + u.adjusted - u.sold }))
    .sort((a, b) => b.sold - a.sold || a.name.localeCompare(b.name));

  function reasonLabel(key: string): string {
    if (key === "UNSPECIFIED") return "Unspecified";
    return ADJUSTMENT_REASON_LABELS[key as AdjustmentReasonCategory] ?? key;
  }

  type ShrinkRow = { name: string; reason: string; qty: number };
  const shrinkRows: ShrinkRow[] = [];
  for (const [productId, reasons] of shrinkByProduct) {
    const name = byProduct.get(productId)?.name ?? "—";
    for (const [reason, qty] of reasons) {
      shrinkRows.push({ name, reason: reasonLabel(reason), qty });
    }
  }
  shrinkRows.sort((a, b) => a.name.localeCompare(b.name) || b.qty - a.qty);
  const totalShrinkage = shrinkRows.reduce((s, r) => s + r.qty, 0);

  const usageHeaders = [
    "Product",
    "Sold",
    "Restocked",
    "Adjusted (net)",
    "Net stock change",
  ];
  const usageCsv: (string | number)[][] = rows.map((r) => [
    r.name,
    r.sold,
    r.restocked,
    r.adjusted,
    r.stockChange,
  ]);

  const shrinkHeaders = ["Product", "Reason", "Quantity lost"];
  const shrinkCsv: (string | number)[][] = shrinkRows.map((r) => [r.name, r.reason, r.qty]);

  const categoryOptions = [
    { key: "all", label: "All categories" },
    ...categories.map((c) => ({ key: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ReportPeriodSelector
            basePath="/reports/inventory-usage"
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
          filename={`inventory-usage-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={usageHeaders}
          rows={usageCsv}
        />
      </div>

      {rows.length === 0 ? (
        <ReportNoData message="No stock movements in this period." />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Restocked</TableHead>
                  <TableHead className="text-right">Adjusted (net)</TableHead>
                  <TableHead className="text-right">Net stock change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(r.sold)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(r.restocked)}</TableCell>
                    <TableCell
                      className={
                        r.adjusted < 0
                          ? "text-danger-on text-right font-mono tabular-nums"
                          : r.adjusted > 0
                            ? "text-success-on text-right font-mono tabular-nums"
                            : "text-muted-foreground text-right font-mono tabular-nums"
                      }
                    >
                      {signed(r.adjusted)}
                    </TableCell>
                    <TableCell
                      className={
                        r.stockChange < 0
                          ? "text-danger-on text-right font-mono tabular-nums"
                          : r.stockChange > 0
                            ? "text-success-on text-right font-mono tabular-nums"
                            : "text-muted-foreground text-right font-mono tabular-nums"
                      }
                    >
                      {signed(r.stockChange)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Shrinkage</h2>
                <p className="text-muted-foreground text-sm">
                  Stock lost to negative adjustments this period, by cause (ADJUSTMENT
                  entries only).
                </p>
              </div>
              <CsvExportButton
                filename={`inventory-shrinkage-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
                headers={shrinkHeaders}
                rows={shrinkCsv}
              />
            </div>
            {shrinkRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No shrinkage recorded in this period.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Quantity lost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shrinkRows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.reason}</TableCell>
                        <TableCell className="text-danger-on text-right font-mono tabular-nums">
                          {num(r.qty)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium" colSpan={2}>
                        Total shrinkage
                      </TableCell>
                      <TableCell className="text-danger-on text-right font-mono tabular-nums">
                        {num(totalShrinkage)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
