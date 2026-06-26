// Sort types + guard for the Client List. Kept free of any server-only imports
// (no Prisma) so the client toolbar and the shared URL helpers can import it
// without dragging the database client into the browser bundle.

export type ClientListSort = "name" | "expiry" | "lastVisit" | "visits";
export type SortDir = "asc" | "desc";

/** Columns the user can sort via the table header (others are chip-default only). */
export const SORTABLE_COLUMNS = ["name", "expiry"] as const;

export function isSortColumn(v: string | undefined): v is ClientListSort {
  return v === "name" || v === "expiry" || v === "lastVisit" || v === "visits";
}
