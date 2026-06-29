import { describe, it, expect } from "vitest";
import {
  attendanceReportRows,
  sumAttendanceRows,
  type AttReportInput,
} from "./attendance";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

const rows: AttReportInput[] = [
  { clientId: "a", visitType: "MEMBER", visitDate: d("2026-06-01") },
  { clientId: "a", visitType: "MEMBER", visitDate: d("2026-06-01") }, // same member twice, one day
  { clientId: "b", visitType: "WALK_IN", visitDate: d("2026-06-01") },
  { clientId: "a", visitType: "MEMBER", visitDate: d("2026-06-03") }, // a returns another day
];

describe("attendanceReportRows", () => {
  it("splits member vs walk-in and dedups uniques per day, gap-filling", () => {
    const out = attendanceReportRows(rows, d("2026-06-01"), d("2026-06-03"));
    expect(out.map((r) => r.date)).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
    ]);
    const day1 = out[0];
    expect(day1.total).toBe(3);
    expect(day1.unique).toBe(2); // a + b
    expect(day1.memberTotal).toBe(2);
    expect(day1.memberUnique).toBe(1); // a counted once
    expect(day1.walkinTotal).toBe(1);
    expect(day1.walkinUnique).toBe(1);

    expect(out[1].total).toBe(0); // gap-filled empty day

    expect(out[2].total).toBe(1);
    expect(out[2].memberUnique).toBe(1);
  });
});

describe("sumAttendanceRows", () => {
  it("counts unique clients across the whole range, not per day", () => {
    const t = sumAttendanceRows(rows);
    expect(t.total).toBe(4);
    expect(t.unique).toBe(2); // a + b across all days
    expect(t.memberTotal).toBe(3);
    expect(t.memberUnique).toBe(1); // a once across the range
    expect(t.walkinTotal).toBe(1);
    expect(t.walkinUnique).toBe(1);
  });

  it("is all-zero for no rows", () => {
    expect(sumAttendanceRows([])).toEqual({
      total: 0,
      unique: 0,
      memberTotal: 0,
      walkinTotal: 0,
      memberUnique: 0,
      walkinUnique: 0,
    });
  });
});
