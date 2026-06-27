import { Receipt, Ban } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
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
import { isPaymentMethod, PAYMENT_METHOD_LABELS } from "@/lib/payments/method";
import { VOID_REASON_LABELS, type VoidReasonCategory } from "@/lib/payments/void";
import { PosHistoryFilters, type MethodFilter } from "./pos-history-filters";
import { PosVoidAction } from "./pos-void-action";

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// POS History (US-6.10, MODULE-SPECS Module 6) — today's count + revenue strip, then a
// filterable `POS_SALE` list with the additive void action. URL state per ADR-047.
export async function PosHistoryView({
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
  const method: MethodFilter = isPaymentMethod(sp.method) ? sp.method : "all";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = presetRange(preset, today, customFrom, customTo);

  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));
  const todayStart = gymDayStartUtc(timezone, today);
  const todayEnd = gymDayStartUtc(timezone, addDays(today, 1));

  const [records, todayAgg] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        gymId,
        transactionType: "POS_SALE",
        transactionDate: { gte: startUtc, lt: endUtc },
        ...(method === "all" ? {} : { paymentMethod: method }),
      },
      orderBy: { transactionDate: "desc" },
      take: 500,
      select: {
        id: true,
        transactionDate: true,
        totalAmount: true,
        paymentMethod: true,
        status: true,
        voidReasonCategory: true,
        voidReasonNote: true,
        lineItems: { select: { description: true } },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        gymId,
        transactionType: "POS_SALE",
        status: "COMPLETED",
        transactionDate: { gte: todayStart, lt: todayEnd },
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  const todayCount = todayAgg._count;
  const todayRevenue = Number(todayAgg._sum.totalAmount ?? 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-muted-foreground text-xs">Today&apos;s sales</p>
            <p className="text-2xl font-semibold tabular-nums">{todayCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-muted-foreground text-xs">Today&apos;s revenue</p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {peso(todayRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <PosHistoryFilters
        preset={preset}
        method={method}
        from={sp.from ?? toDateInputValue(from)}
        to={sp.to ?? toDateInputValue(to)}
      />

      {records.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No sales in this range"
          description="Completed POS sales appear here. Adjust the date range or payment method."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((t) => {
                const voided = t.status === "VOID";
                const items = t.lineItems.map((li) => li.description);
                return (
                  <TableRow key={t.id} className={voided ? "text-muted-foreground" : ""}>
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {formatDateTimeInTz(t.transactionDate, timezone)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm">
                        {items.length} item{items.length === 1 ? "" : "s"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {items.slice(0, 2).join(", ")}
                        {items.length > 2 ? `, +${items.length - 2} more` : ""}
                      </p>
                    </TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[t.paymentMethod]}</TableCell>
                    <TableCell
                      className={
                        voided
                          ? "text-right font-mono tabular-nums line-through"
                          : "text-right font-mono tabular-nums"
                      }
                    >
                      {peso(Number(t.totalAmount))}
                    </TableCell>
                    <TableCell>
                      {voided ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline" className="text-danger-on w-fit">
                            <Ban aria-hidden /> VOID
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {t.voidReasonCategory
                              ? VOID_REASON_LABELS[t.voidReasonCategory as VoidReasonCategory]
                              : ""}
                            {t.voidReasonNote ? ` — ${t.voidReasonNote}` : ""}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-success-on w-fit">
                          Completed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {voided ? null : (
                        <PosVoidAction
                          transactionId={t.id}
                          label={`${peso(Number(t.totalAmount))} sale`}
                        />
                      )}
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
