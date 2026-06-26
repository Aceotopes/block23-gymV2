import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientTypeBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTimeOnly, toTimeInputValue } from "@/lib/dates";
import { ordinalVisit, type TodaySummaryRow } from "@/lib/attendance/today";
import { AttendanceCorrection } from "./attendance-correction";

// Today's Check-Ins running list (US-4.8/4.9). Total vs unique counts (US-4.5),
// reverse-chronological, repeat same-day visits labelled, and inline same-day
// time correction (US-4.11). Presentational — the page passes the summarized rows.
export function TodayCheckIns({
  total,
  unique,
  rows,
}: {
  total: number;
  unique: number;
  rows: TodaySummaryRow[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold">Today&apos;s check-ins</h2>
        <span className="text-muted-foreground text-sm tabular-nums">
          {total} check-in{total === 1 ? "" : "s"} · {unique} unique
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No check-ins yet today"
          description="Search for a client above to record the first check-in."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-3 px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="truncate font-medium">{r.clientName}</span>
                    <ClientTypeBadge type={r.visitType} />
                    {r.visitNumber > 1 ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        {ordinalVisit(r.visitNumber)}
                      </Badge>
                    ) : null}
                    {r.updatedAt ? (
                      <span
                        className="text-muted-foreground text-xs"
                        title="Check-in time was corrected"
                      >
                        edited
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums">
                      {formatTimeOnly(r.timeIn)}
                    </span>
                    <AttendanceCorrection
                      attendanceId={r.id}
                      clientName={r.clientName}
                      currentTime={toTimeInputValue(r.timeIn)}
                    />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
