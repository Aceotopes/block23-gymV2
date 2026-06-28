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
import { MOVEMENT_TYPE_LABELS } from "@/lib/inventory/adjustment";
import {
  MOVEMENT_TYPE_FILTERS,
  type MovementTypeFilter,
} from "./inventory-search-params";

export type ProductOption = { id: string; name: string };

// Inventory Movement History filters — date preset + movement type + product, URL
// state (ADR-047). Mirrors the POS history filters with two extra dimensions.
export function MovementsFilters({
  preset,
  type,
  productId,
  from,
  to,
  products,
}: {
  preset: DatePreset;
  type: MovementTypeFilter;
  productId: string;
  from: string;
  to: string;
  products: ProductOption[];
}) {
  const router = useRouter();

  function push(next: Record<string, string>) {
    const params = new URLSearchParams({
      view: "movements",
      preset,
      type,
      product: productId,
      from,
      to,
      ...next,
    });
    router.push(`/inventory?${params.toString()}`);
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
          <label className="text-muted-foreground text-xs">Product</label>
          <Select value={productId} onValueChange={(v) => push({ product: v })}>
            <SelectTrigger size="sm" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">Movement type</label>
          <Select value={type} onValueChange={(v) => push({ type: v })}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(MOVEMENT_TYPE_FILTERS.filter((t) => t !== "all") as Exclude<
                MovementTypeFilter,
                "all"
              >[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {MOVEMENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" ? (
          <>
            <div className="space-y-1">
              <label htmlFor="mv-from" className="text-muted-foreground text-xs">
                From
              </label>
              <Input
                id="mv-from"
                type="date"
                value={from}
                max={to || undefined}
                className="w-40 tabular-nums"
                onChange={(e) => push({ from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="mv-to" className="text-muted-foreground text-xs">
                To
              </label>
              <Input
                id="mv-to"
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
