"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildProductsHref, type ProductsQuery } from "./products-search-params";

// Search + show-archived for Product Management. Both write to the URL (ADR-047); the
// server re-queries. Search is debounced so typing doesn't push a history entry/key.
export function ProductsToolbar({ query }: { query: ProductsQuery }) {
  const router = useRouter();
  const [value, setValue] = useState(query.q);
  const initial = useRef(query.q);

  useEffect(() => {
    setValue(query.q);
    initial.current = query.q;
  }, [query.q]);

  useEffect(() => {
    if (value === initial.current) return;
    const t = setTimeout(() => {
      router.push(buildProductsHref(query, { q: value }));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search by name…"
          aria-label="Search products by name"
          className="pl-8"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Label className="text-muted-foreground flex items-center gap-2 text-sm font-normal select-none">
        <input
          type="checkbox"
          className="border-input accent-primary size-4 rounded"
          checked={query.showArchived}
          onChange={(e) =>
            router.push(buildProductsHref(query, { showArchived: e.target.checked }))
          }
        />
        Show archived
      </Label>
    </div>
  );
}
