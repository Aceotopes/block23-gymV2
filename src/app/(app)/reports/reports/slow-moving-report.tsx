import { prisma } from "@/lib/prisma";
import {
  gymDayStartUtc,
  addDays,
  daysBetween,
  formatDateTimeInTz,
} from "@/lib/dates";
import {
  parseSlowMovingWindow,
  costValueInStock,
  SLOW_MOVING_WINDOWS,
} from "@/lib/reports/products";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportSegmentFilter } from "../report-filter";
import { CsvExportButton } from "../csv-export-button";
import { ReportNoData, peso, type ReportProps } from "../report-shell";

// Slow-moving / dead stock (US-8.21) — active products (deleted_at IS NULL) with zero
// sales in the lookback window (30 / 60 / 90 days, default 30). Cost value locked in
// stock = current_stock × cost_price (ADR-026 cost figure; "—" when unset, excluded from
// the cost-value total). Sorted longest-inactive first; never-sold products lead. Sales
// are read from the SALE inventory ledger (ADR-004).

const WINDOW_OPTIONS = SLOW_MOVING_WINDOWS.map((d) => ({
  key: String(d),
  label: `${d} days`,
}));

export async function SlowMovingReport({ gymId, timezone, today, sp }: ReportProps) {
  const window = parseSlowMovingWindow(sp.window);
  const windowStartUtc = gymDayStartUtc(timezone, addDays(today, -window));

  // Gym-local calendar date (UTC-midnight) of an instant, for whole-day age math.
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDateOf = (d: Date) => new Date(`${ymd.format(d)}T00:00:00.000Z`);

  const [products, lastSales] = await Promise.all([
    prisma.product.findMany({
      where: { gymId, deletedAt: null },
      select: {
        id: true,
        name: true,
        currentStock: true,
        costPrice: true,
        category: { select: { name: true } },
      },
    }),
    prisma.inventoryTransaction.groupBy({
      by: ["productId"],
      where: { gymId, type: "SALE" },
      _max: { createdAt: true },
    }),
  ]);

  const lastSaleById = new Map<string, Date>();
  for (const g of lastSales) {
    if (g._max.createdAt) lastSaleById.set(g.productId, g._max.createdAt);
  }

  type Row = {
    name: string;
    category: string;
    currentStock: number;
    costValue: number | null;
    lastSale: Date | null;
    daysSince: number | null;
  };
  const rows: Row[] = [];
  for (const p of products) {
    const lastSale = lastSaleById.get(p.id) ?? null;
    // Has a sale within the window → not slow-moving; skip.
    if (lastSale && lastSale.getTime() >= windowStartUtc.getTime()) continue;
    const currentStock = Number(p.currentStock);
    rows.push({
      name: p.name,
      category: p.category.name,
      currentStock,
      costValue: costValueInStock(currentStock, p.costPrice === null ? null : Number(p.costPrice)),
      lastSale,
      daysSince: lastSale ? daysBetween(localDateOf(lastSale), today) : null,
    });
  }

  // Longest-inactive first: never-sold (null) lead, then by days since descending.
  rows.sort((a, b) => {
    if (a.daysSince === null && b.daysSince === null) return a.name.localeCompare(b.name);
    if (a.daysSince === null) return -1;
    if (b.daysSince === null) return 1;
    return b.daysSince - a.daysSince;
  });

  const totalCostValue = rows.reduce((s, r) => s + (r.costValue ?? 0), 0);

  const csvHeaders = [
    "Product",
    "Category",
    "Current stock",
    "Cost value in stock",
    "Last sale",
    "Days since last sale",
  ];
  const csvRows: (string | number)[][] = rows.map((r) => [
    r.name,
    r.category,
    r.currentStock,
    r.costValue === null ? "" : r.costValue,
    r.lastSale ? formatDateTimeInTz(r.lastSale, timezone) : "Never sold",
    r.daysSince === null ? "" : r.daysSince,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportSegmentFilter
          param="window"
          value={String(window)}
          options={WINDOW_OPTIONS}
          label="No sales in the last"
        />
        <CsvExportButton
          filename={`slow-moving-${window}d`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {rows.length === 0 ? (
        <ReportNoData
          message={`All active products have sales in the last ${window} days.`}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Current stock</TableHead>
                <TableHead className="text-right">Cost value in stock</TableHead>
                <TableHead>Last sale</TableHead>
                <TableHead className="text-right">Days since last sale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.currentStock.toLocaleString("en-PH")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {r.costValue === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      peso(r.costValue)
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {r.lastSale ? (
                      formatDateTimeInTz(r.lastSale, timezone)
                    ) : (
                      <span className="text-muted-foreground">Never sold</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.daysSince === null ? "—" : r.daysSince.toLocaleString("en-PH")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium" colSpan={3}>
                  Total cost value locked in slow-moving stock
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{peso(totalCostValue)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
