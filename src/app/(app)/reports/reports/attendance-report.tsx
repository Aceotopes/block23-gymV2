import { prisma } from "@/lib/prisma";
import {
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
  attendanceReportRows,
  sumAttendanceRows,
  type AttReportInput,
} from "@/lib/reports/attendance";
import { pctChange } from "@/lib/revenue/revenue";
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

// Attendance report (US-8.5) — per-day rows over the selected range with member vs.
// walk-in and unique-visitor splits. Voiding a walk-in payment never removes the
// Attendance record, so this reads raw attendance. The comparison toggle adds an
// equivalent prior-period totals panel with % change per metric. `visit_date` is a
// `@db.Date`, so the date-only range bounds the query directly (no tz conversion).

const COMPARE_OPTIONS = [
  { key: "off", label: "Single period" },
  { key: "on", label: "Compare prior" },
] as const;

const METRICS = [
  { key: "total", label: "Total check-ins" },
  { key: "unique", label: "Unique visitors" },
  { key: "memberTotal", label: "Member check-ins" },
  { key: "walkinTotal", label: "Walk-in check-ins" },
  { key: "memberUnique", label: "Member unique" },
  { key: "walkinUnique", label: "Walk-in unique" },
] as const;

export async function AttendanceReport({ gymId, today, sp }: ReportProps) {
  const period: ReportPeriod = isReportPeriod(sp.period) ? sp.period : "month";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = reportRange(period, today, customFrom, customTo);
  const compare = sp.compare === "on";
  const prior = priorRange({ from, to });

  const [rows, priorRows] = await Promise.all([
    prisma.attendance.findMany({
      where: { gymId, visitDate: { gte: from, lte: to } },
      select: { clientId: true, visitType: true, visitDate: true },
    }),
    compare
      ? prisma.attendance.findMany({
          where: { gymId, visitDate: { gte: prior.from, lte: prior.to } },
          select: { clientId: true, visitType: true, visitDate: true },
        })
      : Promise.resolve([] as AttReportInput[]),
  ]);

  const daily = attendanceReportRows(rows, from, to);
  const totals = sumAttendanceRows(rows);
  const priorTotals = sumAttendanceRows(priorRows);
  const priorHasData = priorRows.length > 0;

  const csvHeaders = [
    "Date",
    "Total",
    "Unique",
    "Member",
    "Walk-in",
    "Member unique",
    "Walk-in unique",
  ];
  const csvRows: (string | number)[][] = daily.map((r) => [
    r.date,
    r.total,
    r.unique,
    r.memberTotal,
    r.walkinTotal,
    r.memberUnique,
    r.walkinUnique,
  ]);
  csvRows.push([
    "Total",
    totals.total,
    totals.unique,
    totals.memberTotal,
    totals.walkinTotal,
    totals.memberUnique,
    totals.walkinUnique,
  ]);

  const pctText = (cur: number, pri: number) => {
    if (!priorHasData) return { text: "N/A", cls: "text-muted-foreground" };
    const p = pctChange(cur, pri);
    if (p === null) return { text: "N/A", cls: "text-muted-foreground" };
    const r = Math.round(p);
    return {
      text: `${r > 0 ? "+" : ""}${r}%`,
      cls: r > 0 ? "text-success-on" : r < 0 ? "text-danger-on" : "text-muted-foreground",
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ReportPeriodSelector
            basePath="/reports/attendance"
            period={period}
            from={sp.from ?? toDateInputValue(from)}
            to={sp.to ?? toDateInputValue(to)}
            extra={{ compare: compare ? "on" : "off" }}
          />
          <ReportSegmentFilter
            param="compare"
            value={compare ? "on" : "off"}
            options={COMPARE_OPTIONS}
          />
        </div>
        <CsvExportButton
          filename={`attendance-${toDateInputValue(from)}-to-${toDateInputValue(to)}`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {compare ? (
        <div className="rounded-md border">
          <p className="text-muted-foreground border-b px-3 py-2 text-sm">
            <span className="text-foreground font-medium">
              {formatDateOnly(from)} – {formatDateOnly(to)}
            </span>{" "}
            vs. prior {formatDateOnly(prior.from)} – {formatDateOnly(prior.to)}
            {priorHasData ? "" : " (no prior data)"}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Prior</TableHead>
                <TableHead className="text-right">% change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {METRICS.map((m) => {
                const cur = totals[m.key];
                const pri = priorTotals[m.key];
                const pc = pctText(cur, pri);
                return (
                  <TableRow key={m.key}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{cur}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {priorHasData ? pri : "—"}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${pc.cls}`}>{pc.text}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {totals.total === 0 ? (
        <ReportNoData message="No check-ins in this period." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Unique</TableHead>
                <TableHead className="text-right">Member</TableHead>
                <TableHead className="text-right">Walk-in</TableHead>
                <TableHead className="text-right">Member unique</TableHead>
                <TableHead className="text-right">Walk-in unique</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daily.map((r) => (
                <TableRow key={r.date}>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {formatDateOnly(new Date(`${r.date}T00:00:00.000Z`))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.unique}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.memberTotal}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.walkinTotal}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.memberUnique}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.walkinUnique}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right tabular-nums">{totals.total}</TableCell>
                <TableCell className="text-right tabular-nums">{totals.unique}</TableCell>
                <TableCell className="text-right tabular-nums">{totals.memberTotal}</TableCell>
                <TableCell className="text-right tabular-nums">{totals.walkinTotal}</TableCell>
                <TableCell className="text-right tabular-nums">{totals.memberUnique}</TableCell>
                <TableCell className="text-right tabular-nums">{totals.walkinUnique}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
