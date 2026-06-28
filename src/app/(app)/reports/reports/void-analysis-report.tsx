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
  VOID_REASON_CATEGORIES,
  VOID_REASON_LABELS,
  type VoidReasonCategory,
} from "@/lib/payments/void";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments/method";
import { Badge } from "@/components/ui/badge";
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
import { VoidTypeFilter } from "./void-type-filter";

const TYPE_LABELS: Record<string, string> = {
  CLIENT_TRANSACTION: "Client",
  POS_SALE: "POS sale",
};

// Void analysis (US-8.15) — voided transactions by reason category and period, spanning
// both transaction types (ADR-028 pattern detection). Summary (all categories, never
// collapsed) + detail rows. Voided amounts are the amount removed from revenue (shown
// positive, never re-added to totals).
export async function VoidAnalysisReport({ gymId, timezone, today, sp }: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);
  const typeFilter =
    sp.type === "CLIENT_TRANSACTION" || sp.type === "POS_SALE" ? sp.type : "both";

  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));

  const voids = await prisma.transaction.findMany({
    where: {
      gymId,
      status: "VOID",
      transactionDate: { gte: startUtc, lt: endUtc },
      ...(typeFilter === "both" ? {} : { transactionType: typeFilter }),
    },
    orderBy: { transactionDate: "desc" },
    take: 1000,
    select: {
      id: true,
      transactionDate: true,
      transactionType: true,
      totalAmount: true,
      paymentMethod: true,
      voidReasonCategory: true,
      voidReasonNote: true,
    },
  });

  // Summary by category — seed all categories so none collapse (AC).
  const summary = new Map<VoidReasonCategory, { count: number; total: number }>();
  for (const c of VOID_REASON_CATEGORIES) summary.set(c, { count: 0, total: 0 });
  let grandCount = 0;
  let grandTotal = 0;
  for (const v of voids) {
    const amount = Number(v.totalAmount);
    grandCount += 1;
    grandTotal += amount;
    const cat = (v.voidReasonCategory as VoidReasonCategory | null) ?? "OTHER";
    const b = summary.get(cat)!;
    b.count += 1;
    b.total += amount;
  }

  const keep = {
    period,
    from: sp.from ?? toDateInputValue(from),
    to: sp.to ?? toDateInputValue(to),
  };

  const csvHeaders = ["Date", "Type", "Amount", "Reason", "Note", "Payment method"];
  const csvRows = voids.map((v) => [
    formatDateTimeInTz(v.transactionDate, timezone),
    TYPE_LABELS[v.transactionType] ?? v.transactionType,
    Number(v.totalAmount),
    v.voidReasonCategory ? VOID_REASON_LABELS[v.voidReasonCategory as VoidReasonCategory] : "",
    v.voidReasonNote ?? "",
    PAYMENT_METHOD_LABELS[v.paymentMethod],
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ReportPeriodSelector
            basePath="/reports/void-analysis"
            period={period}
            from={keep.from}
            to={keep.to}
            extra={{ type: typeFilter }}
          />
          <VoidTypeFilter type={typeFilter} keep={keep} />
        </div>
        <CsvExportButton
          filename={`void-analysis-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {/* Summary by category — always shows all categories */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Void reason</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Amount removed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VOID_REASON_CATEGORIES.map((c) => {
              const b = summary.get(c)!;
              return (
                <TableRow key={c} className={b.count === 0 ? "text-muted-foreground" : ""}>
                  <TableCell>{VOID_REASON_LABELS[c]}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.count}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(b.total)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Grand total</TableCell>
              <TableCell className="text-right tabular-nums">{grandCount}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{peso(grandTotal)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Detail */}
      {voids.length === 0 ? (
        <ReportNoData message="No voided transactions in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voids.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {formatDateTimeInTz(v.transactionDate, timezone)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TYPE_LABELS[v.transactionType] ?? v.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {peso(Number(v.totalAmount))}
                  </TableCell>
                  <TableCell>
                    <span>
                      {v.voidReasonCategory
                        ? VOID_REASON_LABELS[v.voidReasonCategory as VoidReasonCategory]
                        : "—"}
                    </span>
                    {v.voidReasonNote ? (
                      <span className="text-muted-foreground block text-xs">{v.voidReasonNote}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[v.paymentMethod]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
