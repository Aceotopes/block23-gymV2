import { ScrollText } from "lucide-react";
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
import {
  gymDayStartUtc,
  addDays,
  parseDateOnly,
  toDateInputValue,
  formatDateTimeInTz,
} from "@/lib/dates";
import {
  isDatePreset,
  presetRange,
  type DatePreset,
} from "@/lib/attendance/history";
import {
  ADJUSTMENT_REASON_LABELS,
  MOVEMENT_TYPE_LABELS,
  type AdjustmentReasonCategory,
} from "@/lib/inventory/adjustment";
import {
  isMovementTypeFilter,
  type MovementTypeFilter,
} from "./inventory-search-params";
import { MovementsFilters, type ProductOption } from "./movements-filters";

function num(value: number): string {
  return value.toLocaleString("en-PH");
}

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function signed(value: number): string {
  return value > 0 ? `+${num(value)}` : num(value);
}

// Inventory Movement History (US-7.2, Module 7) — the per-product ledger of every
// PURCHASE / SALE / ADJUSTMENT, with restock cost and adjustment reasons. The audit
// surface for everything stock-related. URL filter state per ADR-047.
export async function MovementsView({
  gymId,
  timezone,
  today,
  sp,
}: {
  gymId: string;
  timezone: string;
  today: Date;
  sp: Record<string, string | undefined>;
}) {
  const preset: DatePreset = isDatePreset(sp.preset) ? sp.preset : "last30";
  const type: MovementTypeFilter = isMovementTypeFilter(sp.type) ? sp.type : "all";
  const productId = sp.product && sp.product !== "all" ? sp.product : "all";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = presetRange(preset, today, customFrom, customTo);

  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));

  const [records, products] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where: {
        gymId,
        createdAt: { gte: startUtc, lt: endUtc },
        ...(type === "all" ? {} : { type }),
        ...(productId === "all" ? {} : { productId }),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        createdAt: true,
        type: true,
        quantityDelta: true,
        resultingStock: true,
        adjustmentReasonCategory: true,
        totalRestockCost: true,
        note: true,
        product: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: { gymId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const productOptions: ProductOption[] = products;

  return (
    <div className="space-y-4">
      <MovementsFilters
        preset={preset}
        type={type}
        productId={productId}
        from={sp.from ?? toDateInputValue(from)}
        to={sp.to ?? toDateInputValue(to)}
        products={productOptions}
      />

      {records.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No movements in this range"
          description="Restocks, sales, and adjustments appear here. Adjust the filters above."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Resulting</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((m) => {
                const delta = Number(m.quantityDelta);
                const reason = m.adjustmentReasonCategory
                  ? ADJUSTMENT_REASON_LABELS[
                      m.adjustmentReasonCategory as AdjustmentReasonCategory
                    ]
                  : null;
                const isForcedSale =
                  m.adjustmentReasonCategory === "FORCED_SALE";
                return (
                  <TableRow key={m.id}>
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {formatDateTimeInTz(m.createdAt, timezone)}
                    </TableCell>
                    <TableCell className="font-medium">{m.product.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isForcedSale ? "text-danger-on w-fit" : "w-fit"
                        }
                      >
                        {MOVEMENT_TYPE_LABELS[m.type]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        delta > 0
                          ? "text-success-on text-right font-mono tabular-nums"
                          : delta < 0
                            ? "text-danger-on text-right font-mono tabular-nums"
                            : "text-muted-foreground text-right font-mono tabular-nums"
                      }
                    >
                      {signed(delta)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {num(Number(m.resultingStock))}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs text-sm">
                      {m.type === "PURCHASE" && m.totalRestockCost !== null ? (
                        <span>Cost {peso(Number(m.totalRestockCost))}</span>
                      ) : null}
                      {reason ? (
                        <span className={isForcedSale ? "text-danger-on" : ""}>
                          {reason}
                        </span>
                      ) : null}
                      {m.note ? (
                        <span className="block truncate">{m.note}</span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
