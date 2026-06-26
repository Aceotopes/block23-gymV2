import Link from "next/link";
import { Users, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  ClientTypeBadge,
  AtRiskBadge,
} from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateOnly } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ClientListResult, ClientListSort } from "@/lib/clients/list";
import { ClientRowActions } from "./client-row-actions";
import { buildClientsHref, type ClientsQuery } from "./search-params";

function SortHeader({
  column,
  label,
  query,
  result,
  className,
}: {
  column: ClientListSort;
  label: string;
  query: ClientsQuery;
  result: ClientListResult;
  className?: string;
}) {
  const active = result.sort === column;
  const nextDir = active && result.dir === "asc" ? "desc" : "asc";
  const Icon = !active
    ? ChevronsUpDown
    : result.dir === "asc"
      ? ChevronUp
      : ChevronDown;
  return (
    <TableHead
      aria-sort={
        active ? (result.dir === "asc" ? "ascending" : "descending") : "none"
      }
      className={className}
    >
      <Link
        href={buildClientsHref(query, { sort: column, dir: nextDir, page: 1 })}
        className="hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {label}
        <Icon
          className={cn("size-3.5", active ? "text-foreground" : "opacity-60")}
          aria-hidden
        />
      </Link>
    </TableHead>
  );
}

export function ClientsTable({
  query,
  result,
}: {
  query: ClientsQuery;
  result: ClientListResult;
}) {
  const { rows, total, page, pageCount, pageSize } = result;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + rows.length;

  const filtersActive =
    query.q !== "" || query.chip !== "all" || query.showArchived;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <SortHeader
                column="name"
                label="Full name"
                query={query}
                result={result}
              />
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <SortHeader
                column="expiry"
                label="Membership expiry"
                query={query}
                result={result}
              />
              <TableHead>Contact</TableHead>
              <TableHead className="w-10 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={Users}
                    title={
                      filtersActive ? "No clients match" : "No clients yet"
                    }
                    description={
                      filtersActive
                        ? "Try a different search or filter."
                        : "Register your first client to get started."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const d = row.derived;
                return (
                  <TableRow
                    key={row.id}
                    className={cn(row.archived && "opacity-55")}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/clients/${row.id}`}
                        className="hover:text-primary-on focus-visible:ring-ring/50 hover:underline focus-visible:ring-[3px] focus-visible:outline-none"
                      >
                        {row.fullName}
                      </Link>
                      {row.archived ? (
                        <span className="text-muted-foreground ml-2 text-xs">
                          (archived)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <ClientTypeBadge type={d.clientType} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={d.status} />
                        {d.atRisk ? <AtRiskBadge /> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {d.clientType === "MEMBER" && d.membershipExpiry
                        ? formatDateOnly(d.membershipExpiry)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.contactNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ClientRowActions
                        client={{
                          id: row.id,
                          fullName: row.fullName,
                          contactNumber: row.contactNumber,
                          email: row.email,
                          notes: row.notes,
                          archived: row.archived,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between gap-4 text-sm">
        <p aria-live="polite" className="tabular-nums">
          {total === 0 ? "0 clients" : `${start}–${end} of ${total}`}
        </p>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildClientsHref(query, { page: page - 1 })}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
                className={cn(page <= 1 && "pointer-events-none opacity-50")}
              >
                Previous
              </Link>
            </Button>
            <span className="tabular-nums">
              Page {page} of {pageCount}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildClientsHref(query, { page: page + 1 })}
                aria-disabled={page >= pageCount}
                tabIndex={page >= pageCount ? -1 : undefined}
                className={cn(
                  page >= pageCount && "pointer-events-none opacity-50",
                )}
              >
                Next
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
