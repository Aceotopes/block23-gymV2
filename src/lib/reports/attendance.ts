import { addDays, dateOnlyUTC } from "@/lib/dates";

// Pure attendance-report aggregation (Module 8 — US-8.5). Per-day rows with member vs.
// walk-in and unique-visitor splits, gap-filled across the range so empty days render
// as zero. Voiding a walk-in payment never removes the Attendance record (US-8.5), so
// these read raw attendance rows directly. `visitDate` is a `@db.Date` (UTC midnight).

export type AttReportInput = {
  clientId: string;
  visitType: "MEMBER" | "WALK_IN";
  visitDate: Date;
};

export type AttendanceReportRow = {
  date: string;
  total: number;
  unique: number;
  memberTotal: number;
  walkinTotal: number;
  memberUnique: number;
  walkinUnique: number;
};

export type AttendanceTotals = Omit<AttendanceReportRow, "date">;

export function attendanceReportRows(
  rows: AttReportInput[],
  from: Date,
  to: Date,
): AttendanceReportRow[] {
  type Bucket = {
    total: number;
    clients: Set<string>;
    memberTotal: number;
    walkinTotal: number;
    memberClients: Set<string>;
    walkinClients: Set<string>;
  };
  const byDay = new Map<string, Bucket>();
  const ensure = (key: string): Bucket => {
    let b = byDay.get(key);
    if (!b) {
      b = {
        total: 0,
        clients: new Set(),
        memberTotal: 0,
        walkinTotal: 0,
        memberClients: new Set(),
        walkinClients: new Set(),
      };
      byDay.set(key, b);
    }
    return b;
  };

  for (const r of rows) {
    const key = r.visitDate.toISOString().slice(0, 10);
    const b = ensure(key);
    b.total += 1;
    b.clients.add(r.clientId);
    if (r.visitType === "MEMBER") {
      b.memberTotal += 1;
      b.memberClients.add(r.clientId);
    } else {
      b.walkinTotal += 1;
      b.walkinClients.add(r.clientId);
    }
  }

  const out: AttendanceReportRow[] = [];
  for (let d = dateOnlyUTC(from); d.getTime() <= to.getTime(); d = addDays(d, 1)) {
    const key = d.toISOString().slice(0, 10);
    const b = byDay.get(key);
    out.push({
      date: key,
      total: b?.total ?? 0,
      unique: b?.clients.size ?? 0,
      memberTotal: b?.memberTotal ?? 0,
      walkinTotal: b?.walkinTotal ?? 0,
      memberUnique: b?.memberClients.size ?? 0,
      walkinUnique: b?.walkinClients.size ?? 0,
    });
  }
  return out;
}

/**
 * Range totals computed from the raw rows — unique counts are distinct clients across
 * the whole range, NOT the sum of daily uniques (a client visiting two days counts
 * once). Used for the report footer and the period-over-period comparison (US-8.5).
 */
export function sumAttendanceRows(rows: AttReportInput[]): AttendanceTotals {
  const clients = new Set<string>();
  const memberClients = new Set<string>();
  const walkinClients = new Set<string>();
  let total = 0;
  let memberTotal = 0;
  let walkinTotal = 0;
  for (const r of rows) {
    total += 1;
    clients.add(r.clientId);
    if (r.visitType === "MEMBER") {
      memberTotal += 1;
      memberClients.add(r.clientId);
    } else {
      walkinTotal += 1;
      walkinClients.add(r.clientId);
    }
  }
  return {
    total,
    unique: clients.size,
    memberTotal,
    walkinTotal,
    memberUnique: memberClients.size,
    walkinUnique: walkinClients.size,
  };
}
