"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { buildStockHref, type StockQuery } from "./inventory-search-params";

// Current Stock view toolbar — show-archived toggle, URL state (ADR-047). Archived
// products keep their stock and ledger; they stay visible here so the owner can write
// off remaining stock (MODULE-SPECS Module 7).
export function StockToolbar({ query }: { query: StockQuery }) {
  const router = useRouter();
  return (
    <Label className="text-muted-foreground flex w-fit items-center gap-2 text-sm font-normal select-none">
      <input
        type="checkbox"
        className="border-input accent-primary size-4 rounded"
        checked={query.showArchived}
        onChange={(e) =>
          router.push(buildStockHref({ showArchived: e.target.checked }))
        }
      />
      Show archived
    </Label>
  );
}
