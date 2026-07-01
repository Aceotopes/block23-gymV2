import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  ClipboardList,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import {
  gymToday,
  formatDateOnly,
  formatTimeOnly,
  toTimeInputValue,
} from "@/lib/dates";
import {
  deriveClient,
  deriveMembershipStatus,
  deriveMembershipAction,
  latestRelevantEnd,
} from "@/lib/clients/derive";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, ClientTypeBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  presetRange,
  isVisitTypeFilter,
  type VisitTypeFilter,
} from "@/lib/attendance/history";
import { ClientRowActions } from "../client-row-actions";
import { MembershipActions } from "./membership-actions-ui";
import { MembershipRowActions } from "./membership-row-actions";
import { AttendanceCorrection } from "../../attendance/attendance-correction";
import { ProfileAttendanceFilters } from "./profile-attendance-filters";
import { isProfileRange, type ProfileRange } from "./profile-attendance-params";

export const metadata = { title: "Client · Block23 Gym" };

function peso(value: { toString(): string }): string {
  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

type TabKey = "membership" | "attendance";

export default async function ClientProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; dp?: string; vt?: string }>;
}) {
  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  const { id } = await params;
  // Guard malformed ids: the PK is a UUID (`@db.Uuid`), so a non-UUID path segment
  // would throw at the query layer (500) — treat it as a missing client (404).
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    notFound();
  }
  const sp = await searchParams;
  const tab: TabKey = sp.tab === "attendance" ? "attendance" : "membership";
  const attRange: ProfileRange = isProfileRange(sp.dp) ? sp.dp : "all";
  const attVisitType: VisitTypeFilter = isVisitTypeFilter(sp.vt)
    ? sp.vt
    : "all";

  const [client, activePlans] = await Promise.all([
    prisma.client.findFirst({
      where: { id, gymId: gym.id },
      include: {
        memberships: {
          orderBy: { startDate: "desc" },
          include: {
            membershipPlan: { select: { name: true } },
            transactionLineItems: {
              select: { transaction: { select: { status: true } } },
            },
          },
        },
        attendances: {
          orderBy: [{ visitDate: "desc" }, { timeIn: "desc" }],
          select: {
            id: true,
            visitDate: true,
            timeIn: true,
            visitType: true,
            updatedAt: true,
          },
        },
      },
    }),
    // Active plans for the Add/Renew selector (US-3.9 — is_active = true, ADR-015).
    prisma.membershipPlan.findMany({
      where: { gymId: gym.id, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, durationDays: true, defaultPrice: true },
    }),
  ]);
  if (!client) notFound();

  const today = gymToday(gym.timezone);
  const totalVisits = client.attendances.length;
  const lastVisitDate = client.attendances[0]?.visitDate ?? null;
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1),
  );
  const visitsThisMonth = client.attendances.filter(
    (a) => a.visitDate >= monthStart && a.visitDate < monthEnd,
  ).length;

  const derived = deriveClient({
    memberships: client.memberships,
    lastVisitDate,
    totalVisits,
    today,
    thresholds: {
      expirationWarningDays: gym.expirationWarningDays,
      walkinInactivityThresholdDays: gym.walkinInactivityThresholdDays,
      memberInactivityWarningDays: gym.memberInactivityWarningDays,
    },
  });

  // Context-aware membership action (US-3.2, ADR-037): add / renew / renew-early /
  // upcoming-only — centralized so the button, block guard, and renewal math agree.
  const membershipAction = deriveMembershipAction(
    client.memberships,
    today,
    gym.expirationWarningDays,
  );
  const renewAnchorEnd = latestRelevantEnd(client.memberships, today);

  // Per-client attendance tab filtering (US-4.3) — in-memory over the loaded records.
  const attBounds = attRange === "all" ? null : presetRange(attRange, today);
  const filteredAttendances = client.attendances.filter((a) => {
    if (attVisitType !== "all" && a.visitType !== attVisitType) return false;
    if (attBounds) {
      if (a.visitDate.getTime() < attBounds.from.getTime()) return false;
      if (a.visitDate.getTime() > attBounds.to.getTime()) return false;
    }
    return true;
  });

  return (
    <>
      <Link
        href="/clients"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to clients
      </Link>

      <PageHeader
        title={client.fullName}
        action={
          <div className="flex items-center gap-2">
            <MembershipActions
              clientId={client.id}
              action={membershipAction}
              activePlans={activePlans.map((p) => ({
                id: p.id,
                name: p.name,
                durationDays: p.durationDays,
                defaultPrice: Number(p.defaultPrice),
              }))}
              renewAnchorEnd={renewAnchorEnd}
              today={today}
            />
            <ClientRowActions
              showView={false}
              client={{
                id: client.id,
                fullName: client.fullName,
                contactNumber: client.contactNumber,
                email: client.email,
                notes: client.notes,
                archived: client.deletedAt !== null,
              }}
            />
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <ClientTypeBadge type={derived.clientType} />
        <StatusBadge status={derived.status} />
        {client.deletedAt !== null ? (
          <Badge variant="outline" className="text-muted-foreground">
            Archived
          </Badge>
        ) : null}
      </div>

      {/* Quick-stats strip (US-2.4 / US-2.10) */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total visits" value={String(totalVisits)} />
        <StatTile label="Visits this month" value={String(visitsThisMonth)} />
        {derived.clientType === "MEMBER" ? (
          <StatTile
            label="Membership"
            value={
              derived.daysUntilExpiry !== null
                ? `${derived.daysUntilExpiry}d left`
                : "—"
            }
            hint={
              derived.membershipExpiry
                ? `Expires ${formatDateOnly(derived.membershipExpiry)}`
                : "No active membership"
            }
          />
        ) : (
          <StatTile
            label="Walk-in visits"
            value={String(totalVisits)}
            hint="No membership — conversion opportunity"
          />
        )}
        <StatTile
          label="Last visit"
          value={
            derived.daysSinceLastVisit === null
              ? "Never"
              : derived.daysSinceLastVisit === 0
                ? "Today"
                : `${derived.daysSinceLastVisit}d ago`
          }
          hint={lastVisitDate ? formatDateOnly(lastVisitDate) : undefined}
        />
      </div>

      {/* Details */}
      <Card className="mb-6">
        <CardContent className="grid gap-x-8 gap-y-3 p-4 sm:grid-cols-2">
          <Detail label="Contact number" value={client.contactNumber} />
          <Detail label="Email" value={client.email} />
          <Detail
            label="Registered"
            value={formatDateOnly(client.dateRegistered)}
          />
          <Detail label="Notes" value={client.notes} />
        </CardContent>
      </Card>

      {/* Tabs (URL-driven — §14.4) */}
      <div className="mb-4 flex gap-1 border-b">
        <TabLink
          id={id}
          tab="membership"
          active={tab === "membership"}
          label="Membership history"
        />
        <TabLink
          id={id}
          tab="attendance"
          active={tab === "attendance"}
          label="Attendance history"
        />
      </div>

      {tab === "membership" ? (
        <MembershipHistory
          clientId={client.id}
          memberships={client.memberships}
          today={today}
          expirationWarningDays={gym.expirationWarningDays}
        />
      ) : (
        <AttendanceHistory
          clientId={client.id}
          clientName={client.fullName}
          attendances={filteredAttendances}
          today={today}
          range={attRange}
          visitType={attVisitType}
        />
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

function TabLink({
  id,
  tab,
  active,
  label,
}: {
  id: string;
  tab: TabKey;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={`/clients/${id}?tab=${tab}`}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "border-primary text-foreground -mb-px border-b-2 px-3 py-2 text-sm font-medium"
          : "text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium"
      }
    >
      {label}
    </Link>
  );
}

type MembershipRow = {
  id: string;
  startDate: Date;
  endDate: Date;
  cancelledAt: Date | null;
  pricePaid: { toString(): string };
  membershipPlan: { name: string } | null;
  transactionLineItems: { transaction: { status: string } }[];
};

function MembershipHistory({
  clientId,
  memberships,
  today,
  expirationWarningDays,
}: {
  clientId: string;
  memberships: MembershipRow[];
  today: Date;
  expirationWarningDays: number;
}) {
  if (memberships.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No memberships yet"
        description="Use “Add membership” above to record this client's first plan."
      />
    );
  }
  return (
    <div className="space-y-2">
      {memberships.map((m) => {
        const status = deriveMembershipStatus(m, today, expirationWarningDays);
        const voided = m.transactionLineItems.some(
          (li) => li.transaction.status === "VOID",
        );
        return (
          <Card key={m.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="space-y-1">
                <p className="font-medium">
                  {m.membershipPlan?.name ?? "Custom (ad-hoc)"}
                </p>
                <p className="text-muted-foreground text-sm tabular-nums">
                  {formatDateOnly(m.startDate)} – {formatDateOnly(m.endDate)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {status === "CANCELLED" ? (
                  <Badge
                    variant="outline"
                    className="text-muted-foreground line-through"
                  >
                    <XCircle aria-hidden /> Cancelled
                  </Badge>
                ) : (
                  <StatusBadge status={status} />
                )}
                <span
                  className={
                    voided
                      ? "text-muted-foreground font-mono text-sm tabular-nums line-through"
                      : "font-mono text-sm tabular-nums"
                  }
                >
                  {peso(m.pricePaid)}
                </span>
                {voided ? (
                  <Badge variant="outline" className="text-danger-on">
                    <Ban aria-hidden /> VOID
                  </Badge>
                ) : null}
                {status !== "CANCELLED" ? (
                  <MembershipRowActions
                    clientId={clientId}
                    membershipId={m.id}
                    label={m.membershipPlan?.name ?? "Custom (ad-hoc)"}
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

type AttendanceRow = {
  id: string;
  visitDate: Date;
  timeIn: Date;
  visitType: "MEMBER" | "WALK_IN";
  updatedAt: Date | null;
};

function AttendanceHistory({
  clientId,
  clientName,
  attendances,
  today,
  range,
  visitType,
}: {
  clientId: string;
  clientName: string;
  attendances: AttendanceRow[];
  today: Date;
  range: ProfileRange;
  visitType: VisitTypeFilter;
}) {
  return (
    <div>
      <ProfileAttendanceFilters
        clientId={clientId}
        range={range}
        visitType={visitType}
      />
      {attendances.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No matching check-ins"
          description="Check-ins appear here. Adjust the range or visit-type filter above."
        />
      ) : (
        <div className="space-y-2">
          {attendances.slice(0, 100).map((a) => {
            const isToday = a.visitDate.getTime() === today.getTime();
            return (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between gap-3 p-3 px-4">
                  <span className="text-sm tabular-nums">
                    {formatDateOnly(a.visitDate)} · {formatTimeOnly(a.timeIn)}
                    {a.updatedAt ? (
                      <span
                        className="text-muted-foreground ml-2 text-xs"
                        title="Check-in time was corrected"
                      >
                        edited
                      </span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-2">
                    <ClientTypeBadge type={a.visitType} />
                    {isToday ? (
                      <AttendanceCorrection
                        attendanceId={a.id}
                        clientName={clientName}
                        currentTime={toTimeInputValue(a.timeIn)}
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
