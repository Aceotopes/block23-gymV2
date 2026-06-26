import { ClipboardList } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientTypeBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateOnly, formatTimeOnly, toTimeInputValue } from "@/lib/dates";
import type { DatePreset, VisitTypeFilter } from "@/lib/attendance/history";
import { HistoryFilters } from "./history-filters";
import { AttendanceCorrection } from "./attendance-correction";

export type HistoryRow = {
  id: string;
  clientName: string;
  visitType: "MEMBER" | "WALK_IN";
  visitDate: Date;
  timeIn: Date;
  updatedAt: Date | null;
  isToday: boolean;
};

// Attendance History (US-4.3) — all records across clients for the selected range +
// visit type. Filters in the URL (ADR-047). Same-day rows offer time correction.
export function HistoryView({
  rows,
  preset,
  visitType,
  from,
  to,
}: {
  rows: HistoryRow[];
  preset: DatePreset;
  visitType: VisitTypeFilter;
  from: string;
  to: string;
}) {
  return (
    <div className="space-y-4">
      <HistoryFilters
        preset={preset}
        visitType={visitType}
        from={from}
        to={to}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No check-ins in this range"
          description="Adjust the date range or visit-type filter."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time in</TableHead>
                <TableHead className="w-10 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.clientName}</TableCell>
                  <TableCell>
                    <ClientTypeBadge type={r.visitType} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDateOnly(r.visitDate)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatTimeOnly(r.timeIn)}
                    {r.updatedAt ? (
                      <span
                        className="text-muted-foreground ml-2 text-xs"
                        title="Check-in time was corrected"
                      >
                        edited
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.isToday ? (
                      <AttendanceCorrection
                        attendanceId={r.id}
                        clientName={r.clientName}
                        currentTime={toTimeInputValue(r.timeIn)}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
