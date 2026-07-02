"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/lib/nav";

// Topbar search + ⌘K command palette (Block 23 Console prototype). Click the bar
// or press ⌘K / Ctrl+K to open; typing fuzzy-filters the destinations and Enter
// navigates. Section navigation for now — entity search (clients/products/
// transactions) can layer onto the same palette once search endpoints exist.
export function TopbarSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search and navigate (Control or Command + K)"
        className="hidden min-w-[300px] items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-left transition-colors hover:border-[var(--b23-border-2)] md:flex"
      >
        <Search className="size-[15px] text-[var(--b23-faint)]" aria-hidden />
        <span className="text-sm text-muted-foreground">
          Search clients, products, transactions…
        </span>
        <kbd className="ml-auto rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-[var(--b23-faint)]">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Jump to a section"
      >
        <CommandInput placeholder="Jump to a section…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => go(item.href)}
              >
                <item.icon aria-hidden />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
