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
import { Input } from "@/components/ui/input";
import {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  type DatePreset,
  type VisitTypeFilter,
} from "@/lib/attendance/history";

// Attendance History filters (US-4.3). State lives in the URL (ADR-047) — each
// control pushes a new query string; the server re-renders the filtered table.
export function HistoryFilters({
  preset,
  visitType,
  from,
  to,
}: {
  preset: DatePreset;
  visitType: VisitTypeFilter;
  from: string;
  to: string;
}) {
  const router = useRouter();

  function push(next: Record<string, string>) {
    const params = new URLSearchParams({
      view: "history",
      preset,
      type: visitType,
      from,
      to,
      ...next,
    });
    router.push(`/attendance?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {DATE_PRESETS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={preset === p ? "default" : "outline"}
            onClick={() => push({ preset: p })}
          >
            {DATE_PRESET_LABELS[p]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">Visit type</label>
          <Select
            value={visitType}
            onValueChange={(v) => push({ type: v })}
          >
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

        {preset === "custom" ? (
          <>
            <div className="space-y-1">
              <label htmlFor="from" className="text-muted-foreground text-xs">
                From
              </label>
              <Input
                id="from"
                type="date"
                value={from}
                max={to || undefined}
                className="w-40 tabular-nums"
                onChange={(e) => push({ from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="to" className="text-muted-foreground text-xs">
                To
              </label>
              <Input
                id="to"
                type="date"
                value={to}
                min={from || undefined}
                className="w-40 tabular-nums"
                onChange={(e) => push({ to: e.target.value })}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
