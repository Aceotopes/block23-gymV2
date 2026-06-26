"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildClientsHref, type ClientsQuery } from "./search-params";

// Search + show-archived controls. Both write to the URL (ADR-047); the server
// re-queries. Search is debounced so typing doesn't push a history entry per key.
export function ClientsToolbar({ query }: { query: ClientsQuery }) {
  const router = useRouter();
  const [value, setValue] = useState(query.q);
  const initial = useRef(query.q);

  // Keep the box in sync when the URL changes from elsewhere (chip, back button).
  useEffect(() => {
    setValue(query.q);
    initial.current = query.q;
  }, [query.q]);

  useEffect(() => {
    if (value === initial.current) return;
    const t = setTimeout(() => {
      router.push(buildClientsHref(query, { q: value, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
    // query intentionally excluded — we only react to the typed value changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function toggleArchived(checked: boolean) {
    router.push(buildClientsHref(query, { showArchived: checked, page: 1 }));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search by name…"
          aria-label="Search clients by name"
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
          onChange={(e) => toggleArchived(e.target.checked)}
        />
        Show archived
      </Label>
    </div>
  );
}
