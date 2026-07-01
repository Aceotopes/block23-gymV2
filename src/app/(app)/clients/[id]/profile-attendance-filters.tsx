"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VisitTypeFilter } from "@/lib/attendance/history";
import {
  PROFILE_RANGES,
  PROFILE_RANGE_LABELS as RANGE_LABELS,
  type ProfileRange,
} from "./profile-attendance-params";

// Per-client Attendance History filters on the Client Profile (US-4.3 — distinct
// from the Attendance module's History view). State in the URL (ADR-047); the tab
// stays `attendance`. The profile offers quick presets incl. "All time"; arbitrary
// custom ranges live in the Attendance module's History view. The range constants +
// guard live in `profile-attendance-params.ts` so the server page can use them.

export function ProfileAttendanceFilters({
  clientId,
  range,
  visitType,
}: {
  clientId: string;
  range: ProfileRange;
  visitType: VisitTypeFilter;
}) {
  const router = useRouter();

  function push(next: { dp?: string; vt?: string }) {
    const params = new URLSearchParams({
      tab: "attendance",
      dp: next.dp ?? range,
      vt: next.vt ?? visitType,
    });
    router.push(`/clients/${clientId}?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1">
        {PROFILE_RANGES.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={range === r ? "default" : "outline"}
            onClick={() => push({ dp: r })}
          >
            {RANGE_LABELS[r]}
          </Button>
        ))}
      </div>

      <Select value={visitType} onValueChange={(v) => push({ vt: v })}>
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="MEMBER">Member</SelectItem>
          <SelectItem value="WALK_IN">Walk-in</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
