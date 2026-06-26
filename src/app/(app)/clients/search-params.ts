import {
  isClientFilterChip,
  type ClientFilterChip,
} from "@/lib/clients/derive";
import {
  isSortColumn,
  type ClientListSort,
  type SortDir,
} from "@/lib/clients/sort";

// Single source of truth for the Client List's URL state (ADR-047). Importable by
// both server (page, table, chips, pagination links) and client (toolbar search,
// archived toggle) components — no "use client" here.

export type ClientsQuery = {
  q: string;
  chip: ClientFilterChip;
  showArchived: boolean;
  /** null = use the chip's default sort (defaultSortForChip). */
  sort: ClientListSort | null;
  dir: SortDir | null;
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseClientsQuery(sp: RawSearchParams): ClientsQuery {
  const chipRaw = first(sp.chip);
  const sortRaw = first(sp.sort);
  const dirRaw = first(sp.dir);
  const pageRaw = Number(first(sp.page));
  return {
    q: (first(sp.q) ?? "").trim(),
    chip: isClientFilterChip(chipRaw) ? chipRaw : "all",
    showArchived: first(sp.archived) === "1",
    sort: isSortColumn(sortRaw) ? sortRaw : null,
    dir: dirRaw === "asc" || dirRaw === "desc" ? dirRaw : null,
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export const CLIENTS_PATH = "/clients";

export function buildClientsHref(
  current: ClientsQuery,
  patch: Partial<ClientsQuery>,
): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.chip !== "all") params.set("chip", next.chip);
  if (next.showArchived) params.set("archived", "1");
  if (next.sort) params.set("sort", next.sort);
  if (next.dir) params.set("dir", next.dir);
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `${CLIENTS_PATH}?${qs}` : CLIENTS_PATH;
}
