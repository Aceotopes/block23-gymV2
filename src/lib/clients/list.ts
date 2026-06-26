import { prisma } from "@/lib/prisma";
import {
  deriveClient,
  matchesChip,
  type ClientFilterChip,
  type DerivedClient,
} from "@/lib/clients/derive";
import type { ClientListSort, SortDir } from "@/lib/clients/sort";

// Server-side assembly of the Client List (ADR-047): one gym-scoped query +
// attendance aggregate, derive status/type/at-risk through the shared module,
// then filter (chip), sort, and paginate in memory. Single-gym scale (hundreds of
// clients) makes in-memory derivation correct and simplest; the derived predicates
// (at-risk, expiring) can't be expressed as plain SQL `where`s anyway.

export type { ClientListSort, SortDir } from "@/lib/clients/sort";

export type ClientListRow = {
  id: string;
  fullName: string;
  contactNumber: string | null;
  email: string | null;
  notes: string | null;
  archived: boolean;
  derived: DerivedClient;
};

export type ClientListResult = {
  rows: ClientListRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  sort: ClientListSort;
  dir: SortDir;
};

export type GymThresholds = {
  expirationWarningDays: number;
  walkinInactivityThresholdDays: number;
  memberInactivityWarningDays: number;
};

/** Default sort per chip (US-2.10: walk-in by visits desc; US-2.11: at-risk by absence desc). */
export function defaultSortForChip(chip: ClientFilterChip): {
  sort: ClientListSort;
  dir: SortDir;
} {
  if (chip === "walk-in-only") return { sort: "visits", dir: "desc" };
  if (chip === "at-risk") return { sort: "lastVisit", dir: "desc" };
  return { sort: "name", dir: "asc" };
}

function compare(
  a: ClientListRow,
  b: ClientListRow,
  sort: ClientListSort,
): number {
  switch (sort) {
    case "name":
      return a.fullName.localeCompare(b.fullName, undefined, {
        sensitivity: "base",
      });
    case "visits":
      return a.derived.totalVisits - b.derived.totalVisits;
    case "expiry": {
      // Nulls (walk-ins / no expiry) sort last on asc.
      const av =
        a.derived.membershipExpiry?.getTime() ?? Number.POSITIVE_INFINITY;
      const bv =
        b.derived.membershipExpiry?.getTime() ?? Number.POSITIVE_INFINITY;
      return av - bv;
    }
    case "lastVisit": {
      // Days since last visit; never-visited (null) is the longest absence → +Inf.
      const av = a.derived.daysSinceLastVisit ?? Number.POSITIVE_INFINITY;
      const bv = b.derived.daysSinceLastVisit ?? Number.POSITIVE_INFINITY;
      return av - bv;
    }
  }
}

export async function getClientList(params: {
  gymId: string;
  today: Date;
  thresholds: GymThresholds;
  q: string;
  chip: ClientFilterChip;
  showArchived: boolean;
  sort: ClientListSort;
  dir: SortDir;
  page: number;
  pageSize: number;
}): Promise<ClientListResult> {
  const { gymId, today, thresholds, q, chip, showArchived, sort, dir } = params;
  const pageSize = params.pageSize;

  const [clients, visitAgg] = await Promise.all([
    prisma.client.findMany({
      where: {
        gymId,
        ...(showArchived ? {} : { deletedAt: null }),
        ...(q ? { fullName: { contains: q, mode: "insensitive" } } : {}),
      },
      select: {
        id: true,
        fullName: true,
        contactNumber: true,
        email: true,
        notes: true,
        deletedAt: true,
        memberships: {
          select: { startDate: true, endDate: true, cancelledAt: true },
        },
      },
    }),
    prisma.attendance.groupBy({
      by: ["clientId"],
      where: { gymId },
      _count: { _all: true },
      _max: { visitDate: true },
    }),
  ]);

  const visits = new Map(
    visitAgg.map((v) => [
      v.clientId,
      { total: v._count._all, last: v._max.visitDate as Date | null },
    ]),
  );

  let rows: ClientListRow[] = clients.map((c) => {
    const agg = visits.get(c.id);
    const derived = deriveClient({
      memberships: c.memberships,
      lastVisitDate: agg?.last ?? null,
      totalVisits: agg?.total ?? 0,
      today,
      thresholds,
    });
    return {
      id: c.id,
      fullName: c.fullName,
      contactNumber: c.contactNumber,
      email: c.email,
      notes: c.notes,
      archived: c.deletedAt !== null,
      derived,
    };
  });

  rows = rows.filter((r) => matchesChip(r.derived, chip));

  const total = rows.length;
  const factor = dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    const primary = compare(a, b, sort) * factor;
    // Stable, predictable tiebreak by name so pages don't shuffle.
    return primary !== 0
      ? primary
      : a.fullName.localeCompare(b.fullName, undefined, {
          sensitivity: "base",
        });
  });

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page), pageCount);
  const start = (page - 1) * pageSize;
  rows = rows.slice(start, start + pageSize);

  return { rows, total, page, pageSize, pageCount, sort, dir };
}
