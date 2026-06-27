"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

// Collections day selector (US-5.4). Defaults to today; the selected day lives in the
// URL `?date=` param (ADR-047). Capped at today — no future collections to review.
export function CollectionsDate({
  date,
  maxDate,
}: {
  date: string;
  maxDate: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="collections-date" className="text-muted-foreground text-xs">
          Date
        </label>
        <Input
          id="collections-date"
          type="date"
          value={date}
          max={maxDate}
          className="w-44 tabular-nums"
          onChange={(e) => {
            const next = e.target.value;
            const params = new URLSearchParams({ view: "collections" });
            if (next) params.set("date", next);
            router.push(`/payments?${params.toString()}`);
          }}
        />
      </div>
    </div>
  );
}
