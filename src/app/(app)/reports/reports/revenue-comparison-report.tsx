import { prisma } from "@/lib/prisma";
import {
  gymDayStartUtc,
  addDays,
  toDateInputValue,
  parseDateOnly,
  formatDateOnly,
} from "@/lib/dates";
import {
  isReportPeriod,
  reportRange,
  priorRange,
  type ReportPeriod,
} from "@/lib/reports/period";
import {
  classifyClientTransaction,
  revenueBySource,
  pctChange,
  REVENUE_SOURCE_LABELS,
  REVENUE_SOURCES,
  type RevenueRow,
  type ItemType,
} from "@/lib/revenue/revenue";
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
import { peso, type ReportProps } from "../report-shell";

function classify(
  t: { transactionType: string; lineItems: { itemType: string }[] },
): RevenueRow["source"] {
  return t.transactionType === "POS_SALE"
    ? "product"
    : classifyClientTransaction(t.lineItems.map((li) => li.itemType as ItemType));
}

function pctCell(p: number | null): { text: string; cls: string } {
  if (p === null) return { text: "N/A", cls: "text-muted-foreground" };
  const r = Math.round(p);
  return {
    text: `${r > 0 ? "+" : ""}${r}%`,
    cls: r > 0 ? "text-success-on" : r < 0 ? "text-danger-on" : "text-muted-foreground",
  };
}

// Period-over-period revenue comparison (US-8.20). The selected period vs. the
// immediately-preceding range of the same duration, broken down by source with a %
// change per row. Prior with no data → "—" / "N/A". Voids excluded.
export async function RevenueComparisonReport({ gymId, timezone, today, sp }: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const current = reportRange(period, today, customFrom, customTo);
  const prior = priorRange(current);

  const [currentTxns, priorTxns] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        gymId,
        status: "COMPLETED",
        transactionDate: {
          gte: gymDayStartUtc(timezone, current.from),
          lt: gymDayStartUtc(timezone, addDays(current.to, 1)),
        },
      },
      select: { transactionType: true, totalAmount: true, lineItems: { select: { itemType: true } } },
    }),
    prisma.transaction.findMany({
      where: {
        gymId,
        status: "COMPLETED",
        transactionDate: {
          gte: gymDayStartUtc(timezone, prior.from),
          lt: gymDayStartUtc(timezone, addDays(prior.to, 1)),
        },
      },
      select: { transactionType: true, totalAmount: true, lineItems: { select: { itemType: true } } },
    }),
  ]);

  const toRows = (txns: typeof currentTxns): RevenueRow[] =>
    txns.map((t) => ({ source: classify(t), amount: Number(t.totalAmount) }));
  const cur = revenueBySource(toRows(currentTxns));
  const pri = revenueBySource(toRows(priorTxns));
  const priorHasData = priorTxns.length > 0;

  const lines = REVENUE_SOURCES.map((s) => ({
    label: REVENUE_SOURCE_LABELS[s],
    current: cur[s],
    prior: pri[s],
    pct: priorHasData ? pctChange(cur[s], pri[s]) : null,
  }));
  const totalPct = priorHasData ? pctChange(cur.total, pri.total) : null;

  const csvHeaders = ["Source", "Current", "Prior", "% change"];
  const csvRows: (string | number)[][] = lines.map((l) => [
    l.label,
    l.current,
    priorHasData ? l.prior : "",
    l.pct === null ? "N/A" : `${Math.round(l.pct)}%`,
  ]);
  csvRows.push([
    "Total",
    cur.total,
    priorHasData ? pri.total : "",
    totalPct === null ? "N/A" : `${Math.round(totalPct)}%`,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ReportPeriodSelector
          basePath="/reports/revenue-comparison"
          period={period}
          from={sp.from ?? toDateInputValue(current.from)}
          to={sp.to ?? toDateInputValue(current.to)}
        />
        <CsvExportButton
          filename={`revenue-comparison-${toDateInputValue(current.from)}-to-${toDateInputValue(current.to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-medium">
          {formatDateOnly(current.from)} – {formatDateOnly(current.to)}
        </span>{" "}
        vs. prior {formatDateOnly(prior.from)} – {formatDateOnly(prior.to)}
        {priorHasData ? "" : " (no prior data)"}
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">Prior</TableHead>
              <TableHead className="text-right">% change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l) => {
              const pc = pctCell(l.pct);
              return (
                <TableRow key={l.label}>
                  <TableCell className="font-medium">{l.label}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{peso(l.current)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {priorHasData ? peso(l.prior) : "—"}
                  </TableCell>
                  <TableCell className={`text-right font-mono tabular-nums ${pc.cls}`}>{pc.text}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{peso(cur.total)}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {priorHasData ? peso(pri.total) : "—"}
              </TableCell>
              <TableCell className={`text-right font-mono tabular-nums ${pctCell(totalPct).cls}`}>
                {pctCell(totalPct).text}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
