import Link from "next/link";
import {
  Receipt,
  CalendarClock,
  PackageX,
  Wallet,
  Repeat,
  UserMinus,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  toDateInputValue,
  gymDayStartUtc,
  formatDateOnly,
} from "@/lib/dates";
import { deriveClient } from "@/lib/clients/derive";
import {
  classifyClientTransaction,
  dailyRevenueTrend,
  pctChange,
  type DailyRevenueRow,
  type ItemType,
} from "@/lib/revenue/revenue";
import { inventoryValuation, daysUntilStockout } from "@/lib/inventory/stock";
import { summarizeCollections } from "@/lib/payments/collections";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments/method";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardRange,
  type DashboardPeriod,
} from "./dashboard-period-options";
import { DashboardPeriodSelector } from "./dashboard-period";
import {
  RevenueTrendChart,
  MembershipDonutChart,
  DailyAttendanceChart,
  TopProductsChart,
} from "./dashboard-charts";

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pesoCompact(value: number): string {
  return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function signedPct(p: number | null): string {
  if (p === null) return "—";
  const r = Math.round(p);
  return `${r > 0 ? "+" : ""}${r}%`;
}

function signedDelta(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}

// The Dashboard — the owner's daily command center (US-8.1, Module 1). A 6-card KPI
// strip, a period-driven chart row, and live-feed panels. Reads from the unified
// Transaction ledger (ADR-006) + Attendance + the inventory ledger; all "today"/period
// boundaries go through Gym.timezone (ADR-035); voided transactions are excluded from
// every revenue figure. All client signals derive through the shared `deriveClient`.
export async function DashboardView({
  gymId,
  timezone,
  today,
  period,
  thresholds,
}: {
  gymId: string;
  timezone: string;
  today: Date;
  period: DashboardPeriod;
  thresholds: {
    expirationWarningDays: number;
    walkinInactivityThresholdDays: number;
    memberInactivityWarningDays: number;
  };
}) {
  const { from, to } = dashboardRange(period, today);

  // Day list for the gap-filled chart series (gym-local calendar days).
  const days: string[] = [];
  for (let d = from; d.getTime() <= to.getTime(); d = addDays(d, 1)) {
    days.push(toDateInputValue(d));
  }

  // ── Boundaries ──────────────────────────────────────────────────────────────
  const yesterday = addDays(today, -1);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const daysIntoMonth = today.getUTCDate() - 1;
  const lastMonthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
  );
  const lastMonthSameEnd = addDays(lastMonthStart, daysIntoMonth);
  const monthAgo = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, today.getUTCDate()),
  );

  // UTC instants for the instant-typed transaction_date / inventory created_at.
  const chartStartUtc = gymDayStartUtc(timezone, from);
  const chartEndUtc = gymDayStartUtc(timezone, addDays(to, 1));
  const todayStartUtc = gymDayStartUtc(timezone, today);
  const todayEndUtc = gymDayStartUtc(timezone, addDays(today, 1));
  const monthStartUtc = gymDayStartUtc(timezone, monthStart);
  const lastMonthStartUtc = gymDayStartUtc(timezone, lastMonthStart);
  const lastMonthEndUtc = gymDayStartUtc(timezone, addDays(lastMonthSameEnd, 1));
  const last30Utc = gymDayStartUtc(timezone, addDays(today, -29));

  const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const completed = { gymId, status: "COMPLETED" as const };

  const [
    trendTxns,
    todayRevenueAgg,
    mtdRevenueAgg,
    lastMonthRevenueAgg,
    todayCheckins,
    yesterdayCheckins,
    periodAttendance,
    clients,
    attAgg,
    products,
    soldInPeriod,
    soldLast30,
    recentSales,
    todayCollectionRows,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { ...completed, transactionDate: { gte: chartStartUtc, lt: chartEndUtc } },
      select: {
        transactionType: true,
        transactionDate: true,
        totalAmount: true,
        lineItems: { select: { itemType: true } },
      },
    }),
    prisma.transaction.aggregate({
      where: { ...completed, transactionDate: { gte: todayStartUtc, lt: todayEndUtc } },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...completed, transactionDate: { gte: monthStartUtc, lt: todayEndUtc } },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...completed, transactionDate: { gte: lastMonthStartUtc, lt: lastMonthEndUtc } },
      _sum: { totalAmount: true },
    }),
    prisma.attendance.count({ where: { gymId, visitDate: today } }),
    prisma.attendance.count({ where: { gymId, visitDate: yesterday } }),
    prisma.attendance.findMany({
      where: { gymId, visitDate: { gte: from, lte: to } },
      select: { visitType: true, visitDate: true },
    }),
    prisma.client.findMany({
      where: { gymId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
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
    prisma.product.findMany({
      where: { gymId, deletedAt: null },
      select: {
        id: true,
        name: true,
        productType: true,
        currentStock: true,
        costPrice: true,
        lowStockThreshold: true,
        servingsPerContainer: true,
      },
    }),
    prisma.inventoryTransaction.groupBy({
      by: ["productId"],
      where: { gymId, type: "SALE", createdAt: { gte: chartStartUtc, lt: chartEndUtc } },
      _sum: { quantityDelta: true },
    }),
    prisma.inventoryTransaction.groupBy({
      by: ["productId"],
      where: { gymId, type: "SALE", createdAt: { gte: last30Utc } },
      _sum: { quantityDelta: true },
    }),
    prisma.transaction.findMany({
      where: { ...completed, transactionType: "POS_SALE" },
      orderBy: { transactionDate: "desc" },
      take: 5,
      select: {
        id: true,
        transactionDate: true,
        totalAmount: true,
        paymentMethod: true,
        lineItems: { select: { description: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { ...completed, transactionDate: { gte: todayStartUtc, lt: todayEndUtc } },
      select: { paymentMethod: true, totalAmount: true },
    }),
  ]);

  // ── Revenue trend (multi-series, gap-filled) ──────────────────────────────────
  const trendRows: DailyRevenueRow[] = trendTxns.map((t) => ({
    day: dayKeyFmt.format(t.transactionDate),
    source:
      t.transactionType === "POS_SALE"
        ? "product"
        : classifyClientTransaction(t.lineItems.map((li) => li.itemType as ItemType)),
    amount: Number(t.totalAmount),
  }));
  const revenueTrend = dailyRevenueTrend(trendRows, days);

  const todayRevenue = Number(todayRevenueAgg._sum.totalAmount ?? 0);
  const mtdRevenue = Number(mtdRevenueAgg._sum.totalAmount ?? 0);
  const lastMonthRevenue = Number(lastMonthRevenueAgg._sum.totalAmount ?? 0);
  const mtdPct = pctChange(mtdRevenue, lastMonthRevenue);

  // ── Daily attendance (member vs walk-in, gap-filled) ──────────────────────────
  const attMap = new Map(days.map((d) => [d, { date: d, member: 0, walkin: 0 }]));
  for (const a of periodAttendance) {
    const k = toDateInputValue(a.visitDate);
    const row = attMap.get(k);
    if (!row) continue;
    if (a.visitType === "MEMBER") row.member += 1;
    else row.walkin += 1;
  }
  const dailyAttendance = days.map((d) => attMap.get(d)!);

  // ── Client derivation (active/expiring/at-risk/frequent walk-ins) ─────────────
  const aggMap = new Map(attAgg.map((a) => [a.clientId, a]));
  let activeMembers = 0;
  let activeMembersLastMonth = 0;
  let donutActive = 0;
  let donutExpiring = 0;
  let donutExpired = 0;
  const expiringList: {
    id: string;
    name: string;
    expiry: Date | null;
    days: number | null;
  }[] = [];
  const atRiskList: {
    id: string;
    name: string;
    expiry: Date | null;
    days: number | null;
  }[] = [];
  const frequentWalkIns: {
    id: string;
    name: string;
    visits: number;
    lastVisit: Date | null;
  }[] = [];

  for (const c of clients) {
    const agg = aggMap.get(c.id);
    const lastVisitDate = (agg?._max.visitDate as Date | null) ?? null;
    const totalVisits = agg?._count._all ?? 0;
    const d = deriveClient({
      memberships: c.memberships,
      lastVisitDate,
      totalVisits,
      today,
      thresholds,
    });

    if (d.clientType === "MEMBER") {
      if (d.isActiveMembership) activeMembers += 1;
      if (d.memberStatus === "EXPIRING_SOON") donutExpiring += 1;
      else if (d.memberStatus === "ACTIVE") donutActive += 1;
      else if (d.memberStatus === "EXPIRED") donutExpired += 1;
      if (d.expiringSoon) {
        expiringList.push({ id: c.id, name: c.fullName, expiry: d.membershipExpiry, days: d.daysUntilExpiry });
      }
      if (d.atRisk) {
        atRiskList.push({ id: c.id, name: c.fullName, expiry: d.membershipExpiry, days: d.daysSinceLastVisit });
      }
      // Active a month ago (delta) — any non-cancelled membership in effect at monthAgo.
      const wasActive = c.memberships.some(
        (m) =>
          m.cancelledAt === null &&
          m.startDate.getTime() <= monthAgo.getTime() &&
          monthAgo.getTime() <= m.endDate.getTime(),
      );
      if (wasActive) activeMembersLastMonth += 1;
    } else {
      // Walk-in only — candidate for the frequent walk-ins panel (top 5, ADR-036).
      frequentWalkIns.push({ id: c.id, name: c.fullName, visits: totalVisits, lastVisit: lastVisitDate });
    }
  }

  expiringList.sort((a, b) => (a.days ?? 1e9) - (b.days ?? 1e9));
  atRiskList.sort((a, b) => (b.days ?? -1) - (a.days ?? -1));
  frequentWalkIns.sort((a, b) => b.visits - a.visits);
  const topFrequent = frequentWalkIns.filter((w) => w.visits > 0).slice(0, 5);

  const activeMembersDelta = activeMembers - activeMembersLastMonth;
  const checkinsDelta = todayCheckins - yesterdayCheckins;

  const donutData = [
    { name: "Active", value: donutActive, fill: "var(--chart-1)" },
    { name: "Expiring soon", value: donutExpiring, fill: "var(--chart-3)" },
    { name: "Expired", value: donutExpired, fill: "var(--muted-foreground)" },
  ];

  // ── Inventory ─────────────────────────────────────────────────────────────────
  const valuation = inventoryValuation(
    products.map((p) => ({
      currentStock: Number(p.currentStock),
      costPrice: p.costPrice === null ? null : Number(p.costPrice),
    })),
  );
  const sold30Map = new Map<string, number>();
  for (const r of soldLast30) {
    sold30Map.set(r.productId, Math.abs(Number(r._sum.quantityDelta ?? 0)));
  }
  const lowStock = products
    .filter((p) => Number(p.currentStock) <= Number(p.lowStockThreshold))
    .map((p) => {
      const stock = Number(p.currentStock);
      const isServing = p.productType === "SERVING_BASED_PRODUCT";
      const eta = daysUntilStockout(stock, sold30Map.get(p.id) ?? 0);
      return { id: p.id, name: p.name, stock, isServing, eta };
    })
    .slice(0, 6);

  // ── Top products (by units/servings sold over the period) ─────────────────────
  const productName = new Map(products.map((p) => [p.id, p.name]));
  const topProducts = soldInPeriod
    .map((r) => ({
      name: productName.get(r.productId) ?? "—",
      qty: Math.abs(Number(r._sum.quantityDelta ?? 0)),
    }))
    .filter((r) => r.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // ── Today's collections (both transaction types) ──────────────────────────────
  const collections = summarizeCollections(
    todayCollectionRows.map((t) => ({
      paymentMethod: t.paymentMethod,
      totalAmount: Number(t.totalAmount),
    })),
  );

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi
          label="Active members"
          value={String(activeMembers)}
          hint={`${signedDelta(activeMembersDelta)} from last month`}
        />
        <Kpi
          label="Today's check-ins"
          value={String(todayCheckins)}
          hint={`${signedDelta(checkinsDelta)} from yesterday`}
        />
        <Kpi
          label="MTD revenue"
          value={pesoCompact(mtdRevenue)}
          hint={`${signedPct(mtdPct)} vs last month`}
        />
        <Kpi label="Today's revenue" value={pesoCompact(todayRevenue)} mono />
        <Kpi
          label="Expiring soon"
          value={String(donutExpiring)}
          warn={donutExpiring > 0}
        />
        <Kpi
          label="Inventory value"
          value={pesoCompact(valuation.total)}
          hint={
            valuation.excludedCount > 0
              ? `${valuation.excludedCount} without cost price`
              : undefined
          }
          mono
        />
      </div>

      <DashboardPeriodSelector period={period} />

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Revenue trend</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart data={revenueTrend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Membership status</CardTitle>
          </CardHeader>
          <CardContent>
            <MembershipDonutChart data={donutData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyAttendanceChart data={dailyAttendance} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top products</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={topProducts} />
          </CardContent>
        </Card>
      </div>

      {/* Live-feed panels */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Recent POS sales" icon={Receipt}>
          {recentSales.length === 0 ? (
            <FeedEmpty>No product sales yet.</FeedEmpty>
          ) : (
            recentSales.map((s) => (
              <FeedRow
                key={s.id}
                primary={`${s.lineItems.length} item${s.lineItems.length === 1 ? "" : "s"}`}
                secondary={`${PAYMENT_METHOD_LABELS[s.paymentMethod]} · ${relativeTime(s.transactionDate, now)}`}
                value={peso(Number(s.totalAmount))}
                mono
              />
            ))
          )}
        </Panel>

        <Panel title="Expiring soon" icon={CalendarClock} href="/clients?chip=expiring-soon">
          {expiringList.length === 0 ? (
            <FeedEmpty>No memberships expiring soon.</FeedEmpty>
          ) : (
            expiringList.slice(0, 5).map((m) => (
              <FeedRow
                key={m.id}
                href={`/clients/${m.id}`}
                primary={m.name}
                secondary={m.expiry ? `Expires ${formatDateOnly(m.expiry)}` : ""}
                value={m.days !== null ? `${m.days}d` : "—"}
                valueClass={
                  m.days !== null && m.days < 7 ? "text-danger-on" : "text-warning-on"
                }
              />
            ))
          )}
        </Panel>

        <Panel title="Inventory alerts" icon={PackageX} href="/inventory">
          {lowStock.length === 0 ? (
            <FeedEmpty>All products are above their low-stock threshold.</FeedEmpty>
          ) : (
            lowStock.map((p) => (
              <FeedRow
                key={p.id}
                primary={p.name}
                secondary={
                  p.eta === null
                    ? "No recent sales"
                    : `~${Math.floor(p.eta)} days left`
                }
                value={`${p.stock.toLocaleString("en-PH")}${p.isServing ? " serv" : ""}`}
                valueClass="text-warning-on"
              />
            ))
          )}
        </Panel>

        <Panel title="Today's collections" icon={Wallet} href="/payments?view=collections">
          {collections.lines.map((l) => (
            <FeedRow
              key={l.method}
              primary={l.label}
              secondary={`${l.count} txn${l.count === 1 ? "" : "s"}`}
              value={peso(l.total)}
              mono
            />
          ))}
          <div className="flex items-baseline justify-between border-t pt-2 text-sm font-semibold">
            <span>Total</span>
            <span className="font-mono tabular-nums">{peso(collections.grandTotal)}</span>
          </div>
        </Panel>

        <Panel title="Frequent walk-ins" icon={Repeat} href="/clients?chip=walk-in-only">
          {topFrequent.length === 0 ? (
            <FeedEmpty>No walk-in visits recorded yet.</FeedEmpty>
          ) : (
            topFrequent.map((w) => (
              <FeedRow
                key={w.id}
                href={`/clients/${w.id}`}
                primary={w.name}
                secondary={w.lastVisit ? `Last ${formatDateOnly(w.lastVisit)}` : "No visits"}
                value={`${w.visits} visit${w.visits === 1 ? "" : "s"}`}
              />
            ))
          )}
        </Panel>

        <Panel title="At-risk members" icon={UserMinus} href="/clients?chip=at-risk">
          {atRiskList.length === 0 ? (
            <FeedEmpty>All active members have visited recently.</FeedEmpty>
          ) : (
            atRiskList.slice(0, 5).map((m) => (
              <FeedRow
                key={m.id}
                href={`/clients/${m.id}`}
                primary={m.name}
                secondary={m.expiry ? `Expires ${formatDateOnly(m.expiry)}` : ""}
                value={m.days !== null ? `${m.days}d` : "never"}
                valueClass="text-warning-on"
              />
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

function relativeTime(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const dys = Math.round(hrs / 24);
  return `${dys}d ago`;
}

function Kpi({
  label,
  value,
  hint,
  mono,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  warn?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p
          className={`text-2xl font-semibold tabular-nums ${mono ? "font-mono" : ""} ${
            warn ? "text-warning-on" : ""
          }`}
        >
          {value}
        </p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function Panel({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="text-muted-foreground size-4" aria-hidden />
          {title}
        </CardTitle>
        {href ? (
          <Link href={href} className="text-muted-foreground hover:text-primary text-xs">
            View all →
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function FeedRow({
  primary,
  secondary,
  value,
  valueClass,
  mono,
  href,
}: {
  primary: string;
  secondary?: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
  href?: string;
}) {
  const body = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{primary}</p>
        {secondary ? (
          <p className="text-muted-foreground truncate text-xs">{secondary}</p>
        ) : null}
      </div>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${mono ? "font-mono" : ""} ${
          valueClass ?? ""
        }`}
      >
        {value}
      </span>
    </div>
  );
  return href ? (
    <Link href={href} className="hover:bg-muted/50 -mx-2 block rounded px-2 py-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}

function FeedEmpty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground py-2 text-sm">{children}</p>;
}
