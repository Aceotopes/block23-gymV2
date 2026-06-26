import Link from "next/link";
import { CLIENT_FILTER_CHIPS, CHIP_LABELS } from "@/lib/clients/derive";
import { cn } from "@/lib/utils";
import { buildClientsHref, type ClientsQuery } from "./search-params";

// Filter chips (DESIGN-SYSTEM §11.9). Single-select; selecting one replaces the
// prior and resets sort to that chip's default + page to 1. Server-rendered as
// links — the URL is the state (ADR-047). Combine with the name search.
export function ClientFilterChips({ query }: { query: ClientsQuery }) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter clients by status"
    >
      {CLIENT_FILTER_CHIPS.map((chip) => {
        const selected = query.chip === chip;
        return (
          <Link
            key={chip}
            href={buildClientsHref(query, {
              chip,
              page: 1,
              sort: null,
              dir: null,
            })}
            aria-pressed={selected}
            className={cn(
              "focus-visible:ring-ring/50 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
              selected
                ? "border-primary/40 bg-primary/15 text-primary-on"
                : "border-border bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            {CHIP_LABELS[chip]}
          </Link>
        );
      })}
    </div>
  );
}
