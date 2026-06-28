import { Boxes } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { gymDayStartUtc, addDays } from "@/lib/dates";
import {
  daysUntilStockout,
  inventoryValuation,
  shrinkageLevel,
} from "@/lib/inventory/stock";
import {
  ADJUSTMENT_REASON_LABELS,
  type AdjustmentReasonCategory,
} from "@/lib/inventory/adjustment";
import type { ProductType } from "@/lib/products/types";
import type { StockQuery } from "./inventory-search-params";
import { StockToolbar } from "./stock-toolbar";
import { StockRowActions } from "./stock-row-actions";

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function num(value: number): string {
  return value.toLocaleString("en-PH");
}

// Current Stock view (US-7.4/7.6/7.7/7.8, Module 7). Per-product stock with low-stock
// + reorder flags, remaining-servings detail, a derived days-until-stockout estimate,
// and a this-month shrinkage column. A valuation footer sums active priced stock. All
// derived figures are computed at query time from the ledger (ADR-004).
export async function StockView({
  gymId,
  timezone,
  today,
  query,
}: {
  gymId: string;
  timezone: string;
  today: Date;
  query: StockQuery;
}) {
  // Period boundaries (gym-local) as UTC instants for the ledger `created_at`.
  const monthStartDay = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const monthStartUtc = gymDayStartUtc(timezone, monthStartDay);
  const last30Utc = gymDayStartUtc(timezone, addDays(today, -29));

  const [products, soldLast30, soldThisMonth, shrinkageRows] = await Promise.all([
    prisma.product.findMany({
      where: {
        gymId,
        ...(query.showArchived ? {} : { deletedAt: null }),
      },
      orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    }),
    prisma.inventoryTransaction.groupBy({
      by: ["productId"],
      where: { gymId, type: "SALE", createdAt: { gte: last30Utc } },
      _sum: { quantityDelta: true },
    }),
    prisma.inventoryTransaction.groupBy({
      by: ["productId"],
      where: { gymId, type: "SALE", createdAt: { gte: monthStartUtc } },
      _sum: { quantityDelta: true },
    }),
    prisma.inventoryTransaction.groupBy({
      by: ["productId", "adjustmentReasonCategory"],
      where: {
        gymId,
        type: "ADJUSTMENT",
        quantityDelta: { lt: 0 },
        createdAt: { gte: monthStartUtc },
      },
      _sum: { quantityDelta: true },
    }),
  ]);

  // SALE deltas are negative — absolute value is the quantity sold.
  const sold30 = new Map<string, number>();
  for (const r of soldLast30) {
    sold30.set(r.productId, Math.abs(Number(r._sum.quantityDelta ?? 0)));
  }
  const soldMonth = new Map<string, number>();
  for (const r of soldThisMonth) {
    soldMonth.set(r.productId, Math.abs(Number(r._sum.quantityDelta ?? 0)));
  }

  // Shrinkage this month — total + per-category breakdown for the hover detail.
  const shrinkTotal = new Map<string, number>();
  const shrinkBreakdown = new Map<string, string[]>();
  for (const r of shrinkageRows) {
    const qty = Math.abs(Number(r._sum.quantityDelta ?? 0));
    if (qty === 0) continue;
    shrinkTotal.set(r.productId, (shrinkTotal.get(r.productId) ?? 0) + qty);
    const label = r.adjustmentReasonCategory
      ? ADJUSTMENT_REASON_LABELS[
          r.adjustmentReasonCategory as AdjustmentReasonCategory
        ]
      : "Adjustment";
    const list = shrinkBreakdown.get(r.productId) ?? [];
    list.push(`${label} ${num(qty)}`);
    shrinkBreakdown.set(r.productId, list);
  }

  const valuation = inventoryValuation(
    products
      .filter((p) => p.deletedAt === null)
      .map((p) => ({
        currentStock: Number(p.currentStock),
        costPrice: p.costPrice === null ? null : Number(p.costPrice),
      })),
  );

  return (
    <div className="space-y-4">
      <StockToolbar query={query} />

      {products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No products yet"
          description="Add products in POS → Products, then restock them here to build stock levels."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Est. stockout</TableHead>
                <TableHead className="text-right">Shrinkage (mo)</TableHead>
                <TableHead className="w-10 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const stock = Number(p.currentStock);
                const threshold = Number(p.lowStockThreshold);
                const isServing = p.productType === "SERVING_BASED_PRODUCT";
                const spc = p.servingsPerContainer ?? 0;
                const archived = p.deletedAt !== null;

                const low = stock <= threshold;
                const reorder =
                  p.reorderPoint !== null && stock <= p.reorderPoint;

                const days = daysUntilStockout(stock, sold30.get(p.id) ?? 0);
                const shrink = shrinkTotal.get(p.id) ?? 0;
                const level = shrinkageLevel(shrink, soldMonth.get(p.id) ?? 0);

                return (
                  <TableRow
                    key={p.id}
                    className={archived ? "text-muted-foreground" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {archived ? (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Archived
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {p.category.name}
                      </span>
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {isServing ? (
                        <>
                          <div>{num(stock)} servings</div>
                          {spc > 0 ? (
                            <div className="text-muted-foreground text-xs">
                              ≈ {(stock / spc).toFixed(1)} containers · {spc}/container
                            </div>
                          ) : null}
                        </>
                      ) : (
                        `${num(stock)} units`
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {low ? (
                          <Badge
                            variant="outline"
                            className="border-warning-on/25 bg-warning-on/15 text-warning-on w-fit"
                          >
                            Low stock
                          </Badge>
                        ) : null}
                        {reorder ? (
                          <Badge
                            variant="outline"
                            className="text-info-on border-info-on/25 w-fit"
                          >
                            Reorder
                          </Badge>
                        ) : null}
                        {!low && !reorder ? (
                          <span className="text-muted-foreground text-sm">OK</span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                      {days === null
                        ? "No recent sales"
                        : `~${Math.floor(days)} days`}
                    </TableCell>

                    <TableCell
                      className={
                        level === "red"
                          ? "text-danger-on text-right tabular-nums"
                          : level === "amber"
                            ? "text-warning-on text-right tabular-nums"
                            : "text-muted-foreground text-right tabular-nums"
                      }
                      title={shrinkBreakdown.get(p.id)?.join(", ") || undefined}
                    >
                      {shrink === 0 ? "—" : num(shrink)}
                    </TableCell>

                    <TableCell className="text-right">
                      <StockRowActions
                        productId={p.id}
                        name={p.name}
                        productType={p.productType as ProductType}
                        servingsPerContainer={p.servingsPerContainer}
                        currentStock={stock}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex flex-col items-end gap-0.5 border-t px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground text-sm">
                Inventory value
              </span>
              <span className="font-mono text-lg font-semibold tabular-nums">
                {peso(valuation.total)}
              </span>
            </div>
            {valuation.excludedCount > 0 ? (
              <span className="text-muted-foreground text-xs">
                {valuation.excludedCount} product
                {valuation.excludedCount === 1 ? "" : "s"} excluded — no cost price set
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
