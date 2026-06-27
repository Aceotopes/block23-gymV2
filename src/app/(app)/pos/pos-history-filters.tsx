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
} from "@/lib/attendance/history";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/payments/method";

export type MethodFilter = "all" | (typeof PAYMENT_METHODS)[number];

// POS History filters (US-6.10) — date preset + payment method, URL state (ADR-047).
export function PosHistoryFilters({
  preset,
  method,
  from,
  to,
}: {
  preset: DatePreset;
  method: MethodFilter;
  from: string;
  to: string;
}) {
  const router = useRouter();

  function push(next: Record<string, string>) {
    const params = new URLSearchParams({
      view: "history",
      preset,
      method,
      from,
      to,
      ...next,
    });
    router.push(`/pos?${params.toString()}`);
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
          <label className="text-muted-foreground text-xs">Payment method</label>
          <Select value={method} onValueChange={(v) => push({ method: v })}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" ? (
          <>
            <div className="space-y-1">
              <label htmlFor="pos-from" className="text-muted-foreground text-xs">
                From
              </label>
              <Input
                id="pos-from"
                type="date"
                value={from}
                max={to || undefined}
                className="w-40 tabular-nums"
                onChange={(e) => push({ from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pos-to" className="text-muted-foreground text-xs">
                To
              </label>
              <Input
                id="pos-to"
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
