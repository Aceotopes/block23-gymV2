// "Today's Check-Ins" summary (US-4.8/4.9, MODULE-SPECS Module 4). Distinguishes
// total check-ins from unique visitors (US-4.5) and labels a client's repeat
// same-day visits ("2nd visit", "3rd visit"…). Pure — caller passes today's rows.

export type TodayRow = {
  id: string;
  clientId: string;
  clientName: string;
  visitType: "MEMBER" | "WALK_IN";
  timeIn: Date;
  /** null on an unedited record; non-null marks a corrected time_in (ADR-038). */
  updatedAt: Date | null;
};

export type TodaySummaryRow = TodayRow & { visitNumber: number };

const ORDINALS = ["1st", "2nd", "3rd"];

export function ordinalVisit(n: number): string {
  return (ORDINALS[n - 1] ?? `${n}th`) + " visit";
}

/**
 * Returns total check-ins, unique visitors, and the rows in reverse-chronological
 * order each tagged with its `visitNumber` (the n-th check-in for that client
 * today, counting chronologically).
 */
export function summarizeToday(rows: TodayRow[]): {
  total: number;
  unique: number;
  rows: TodaySummaryRow[];
} {
  // Ascending by time to assign visit numbers, then reverse for display.
  const asc = [...rows].sort((a, b) => a.timeIn.getTime() - b.timeIn.getTime());
  const seen = new Map<string, number>();
  const numbered = asc.map((r) => {
    const n = (seen.get(r.clientId) ?? 0) + 1;
    seen.set(r.clientId, n);
    return { ...r, visitNumber: n };
  });
  numbered.reverse();
  return {
    total: rows.length,
    unique: seen.size,
    rows: numbered,
  };
}
