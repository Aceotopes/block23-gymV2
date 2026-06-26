import Link from "next/link";

// Attendance module internal views (ADR-023): Check-In (default) · History ·
// Analytics. The active view lives in the URL `?view=` param (ADR-047).
const VIEWS = [
  { key: "checkin", label: "Check-In" },
  { key: "history", label: "History" },
  { key: "analytics", label: "Analytics" },
] as const;

export type AttendanceViewKey = (typeof VIEWS)[number]["key"];

export function AttendanceNav({ current }: { current: AttendanceViewKey }) {
  return (
    <div className="mb-6 flex gap-1 border-b">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={`/attendance?view=${v.key}`}
          aria-current={current === v.key ? "page" : undefined}
          className={
            current === v.key
              ? "border-primary text-foreground -mb-px border-b-2 px-4 py-2 text-sm font-medium"
              : "text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium"
          }
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
