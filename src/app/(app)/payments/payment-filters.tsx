"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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

// Payment History filters (US-5.2). State lives in the URL (ADR-047) — each control
// pushes a new query string and the server re-renders the filtered table.
export function PaymentFilters({
  preset,
  method,
  q,
  from,
  to,
}: {
  preset: DatePreset;
  method: MethodFilter;
  q: string;
  from: string;
  to: string;
}) {
  const router = useRouter();

  function push(next: Record<string, string>) {
    const params = new URLSearchParams({
      view: "history",
      preset,
      method,
      ...(q ? { q } : {}),
      from,
      to,
      ...next,
    });
    // Drop an emptied search so the URL stays clean.
    if (params.get("q") === "") params.delete("q");
    router.push(`/payments?${params.toString()}`);
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
          <label htmlFor="pay-q" className="text-muted-foreground text-xs">
            Client
          </label>
          <div className="relative w-56">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="pay-q"
              defaultValue={q}
              placeholder="Search by name…"
              autoComplete="off"
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") push({ q: e.currentTarget.value.trim() });
              }}
              onBlur={(e) => {
                if (e.currentTarget.value.trim() !== q) {
                  push({ q: e.currentTarget.value.trim() });
                }
              }}
            />
          </div>
        </div>

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
              <label htmlFor="pay-from" className="text-muted-foreground text-xs">
                From
              </label>
              <Input
                id="pay-from"
                type="date"
                value={from}
                max={to || undefined}
                className="w-40 tabular-nums"
                onChange={(e) => push({ from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pay-to" className="text-muted-foreground text-xs">
                To
              </label>
              <Input
                id="pay-to"
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
