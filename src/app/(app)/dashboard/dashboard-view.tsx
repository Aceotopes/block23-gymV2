import Link from "next/link";
import {
  Banknote,
  Smartphone,
  CreditCard,
  Wallet,
  AlertTriangle,
  CalendarClock,
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
  type RevenueSource,
} from "@/lib/revenue/revenue";
import { inventoryValuation, daysUntilStockout } from "@/lib/inventory/stock";
import { summarizeCollections } from "@/lib/payments/collections";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments/method";
import {
  dashboardRange,
  type DashboardPeriod,
} from "./dashboard-period-options";
import { RevenueTrendChart, MembershipDonutChart, DailyAttendanceChart } from "./dashboard-charts";

// ── Shared card chrome (Block 23 Console) ──────────────────────────────────────
const CARD =
  "rounded-[var(--b23-radius-2xl)] border border-border bg-card shadow-[var(--b23-shadow-card)]";
const PANEL = `${CARD} p-5`;

const TONE = {
  success: "var(--b23-success)",
  danger: "var(--b23-danger)",
  warning: "var(--b23-warning)",
  atRisk: "var(--b23-at-risk)",
  info: "var(--b23-info)",
  neutral: "var(--b23-faint)",
} as const;
type Tone = keyof typeof TONE;

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pesoCompact(value: number): string {
  return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function countDelta(n: number): { text: string; tone: Tone } {
  if (n > 0) return { text: `▲ +${n}`, tone: "success" };
  if (n < 0) return { text: `▼ ${Math.abs(n)}`, tone: "danger" };
  return { text: "±0", tone: "neutral" };
}

function pctDelta(p: number | null): { text: string; tone: Tone } {
  if (p === null) return { text: "—", tone: "neutral" };
  const r = Math.round(p * 10) / 10;
  if (r > 0) return { text: `▲ +${r}%`, tone: "success" };
  if (r < 0) return { text: `▼ ${Math.abs(r)}%`, tone: "danger" };
  return { text: "0%", tone: "neutral" };
}

const METHOD_ICON: Record<string, typeof Banknote> = {
  CASH: Banknote,
  GCASH: Smartphone,
  CARD: CreditCard,
  OTHER: Wallet,
};

// The Dashboard — the owner's daily command center (US-8.1, Module 1), styled to the
// Block 23 Console prototype (ADR-049): a Today's-Revenue hero + 5 stat cards, a
// period-driven chart row, and live-feed panels. Reads from the unified Transaction
// ledger (ADR-006) + Attendance + the inventory ledger; all "today"/period boundaries
// go through Gym.timezone (ADR-035); voided transactions are excluded from every
// revenue figure. All client signals derive through the shared `deriveClient`.
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
  const yesterdayStartUtc = gymDayStartUtc(timezone, yesterday);
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
    mtdRevenueAgg,
    lastMonthRevenueAgg,
    yesterdayRevenueAgg,
    todayCheckins,
    yesterdayCheckins,
    periodAttendance,
    clients,
    attAgg,
    products,
    soldInPeriod,
    soldLast30,
    recentSales,
    todayTxns,
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
      where: { ...completed, transactionDate: { gte: monthStartUtc, lt: todayEndUtc } },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...completed, transactionDate: { gte: lastMonthStartUtc, lt: lastMonthEndUtc } },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...completed, transactionDate: { gte: yesterdayStartUtc, lt: todayStartUtc } },
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
      select: {
        transactionType: true,
        paymentMethod: true,
        totalAmount: true,
        lineItems: { select: { itemType: true } },
      },
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

  const mtdRevenue = Number(mtdRevenueAgg._sum.totalAmount ?? 0);
  const lastMonthRevenue = Number(lastMonthRevenueAgg._sum.totalAmount ?? 0);
  const yesterdayRevenue = Number(yesterdayRevenueAgg._sum.totalAmount ?? 0);
  const mtdPct = pctChange(mtdRevenue, lastMonthRevenue);

  // ── Today's revenue: total, by source, transaction count, vs-yesterday ────────
  const bySource: Record<RevenueSource, number> = { membership: 0, walkin: 0, product: 0 };
  for (const t of todayTxns) {
    const src: RevenueSource =
      t.transactionType === "POS_SALE"
        ? "product"
        : classifyClientTransaction(t.lineItems.map((li) => li.itemType as ItemType));
    bySource[src] += Number(t.totalAmount);
  }
  const todayRevenue = bySource.membership + bySource.walkin + bySource.product;
  const todayCount = todayTxns.length;
  const heroDelta = pctDelta(pctChange(todayRevenue, yesterdayRevenue));
  const [heroWhole, heroCents] = todayRevenue.toFixed(2).split(".");
  const heroWholeGrouped = Number(heroWhole).toLocaleString("en-PH");

  // ── Daily attendance (member vs walk-in, gap-filled) ──────────────────────────
  const attMap = new Map(days.map((d) => [d, { date: d, member: 0, walkin: 0 }]));
  for (const a of periodAttendance) {
    const row = attMap.get(toDateInputValue(a.visitDate));
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
  const expiringList: { id: string; name: string; expiry: Date | null; days: number | null }[] = [];
  const atRiskList: { id: string; name: string; expiry: Date | null; days: number | null }[] = [];
  const frequentWalkIns: { id: string; name: string; visits: number; lastVisit: Date | null }[] = [];

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
      const wasActive = c.memberships.some(
        (m) =>
          m.cancelledAt === null &&
          m.startDate.getTime() <= monthAgo.getTime() &&
          monthAgo.getTime() <= m.endDate.getTime(),
      );
      if (wasActive) activeMembersLastMonth += 1;
    } else {
      frequentWalkIns.push({ id: c.id, name: c.fullName, visits: totalVisits, lastVisit: lastVisitDate });
    }
  }

  expiringList.sort((a, b) => (a.days ?? 1e9) - (b.days ?? 1e9));
  atRiskList.sort((a, b) => (b.days ?? -1) - (a.days ?? -1));
  frequentWalkIns.sort((a, b) => b.visits - a.visits);
  const topFrequent = frequentWalkIns.filter((w) => w.visits > 0).slice(0, 5);

  const activeMembersDelta = countDelta(activeMembers - activeMembersLastMonth);
  const checkinsDelta = countDelta(todayCheckins - yesterdayCheckins);
  const membersTotal = donutActive + donutExpiring + donutExpired;

  const donutData = [
    { name: "Active", value: donutActive, fill: "var(--b23-success)" },
    { name: "Expiring soon", value: donutExpiring, fill: "var(--b23-warning)" },
    { name: "Expired", value: donutExpired, fill: "var(--b23-neutral)" },
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
  const topMax = Math.max(...topProducts.map((p) => p.qty), 1);

  // ── Today's collections (both transaction types) ──────────────────────────────
  const collections = summarizeCollections(
    todayTxns.map((t) => ({
      paymentMethod: t.paymentMethod,
      totalAmount: Number(t.totalAmount),
    })),
  );

  const now = new Date();

  const sources: { label: string; value: number }[] = [
    { label: "Membership", value: bySource.membership },
    { label: "Product", value: bySource.product },
    { label: "Walk-in", value: bySource.walkin },
  ];

  return (
    <div className="space-y-3.5">
      {/* ── KPI zone: Today's Revenue hero + 5 stat cards ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-[var(--b23-radius-3xl)] border p-[26px] sm:col-span-2 lg:row-span-2"
          style={{
            background:
              "linear-gradient(155deg, color-mix(in srgb, var(--b23-accent) 16%, var(--b23-surface)), var(--b23-surface) 58%)",
            borderColor: "color-mix(in srgb, var(--b23-accent) 30%, var(--b23-border))",
            boxShadow: "var(--b23-glow-hero)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--b23-accent-light)" }}
          >
            <span
              className="size-[7px] rounded-full"
              style={{
                background: "var(--b23-accent-light)",
                boxShadow: "0 0 0 4px color-mix(in srgb, var(--b23-accent) 25%, transparent)",
              }}
            />
            Today&apos;s Revenue
          </div>
          <div className="mt-4 flex items-baseline gap-0.5 text-foreground">
            <span className="font-display text-[30px] font-semibold">₱</span>
            <span className="font-display text-[56px] font-semibold leading-none tabular-nums tracking-[var(--b23-track-display)]">
              {heroWholeGrouped}
            </span>
            <span className="font-display text-[26px] font-medium text-muted-foreground">
              .{heroCents}
            </span>
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-semibold"
              style={{ color: TONE[heroDelta.tone], background: `color-mix(in srgb, ${TONE[heroDelta.tone]} 16%, transparent)` }}
            >
              {heroDelta.text}
            </span>
            <span className="text-[13px] text-muted-foreground">
              vs. yesterday · {todayCount} transaction{todayCount === 1 ? "" : "s"}
            </span>
          </div>
          <div
            className="mt-[22px] flex flex-wrap gap-x-8 gap-y-3 border-t pt-[18px]"
            style={{ borderColor: "color-mix(in srgb, var(--b23-accent) 18%, var(--b23-border))" }}
          >
            {sources.map((s) => (
              <div key={s.label}>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--b23-faint)]">
                  {s.label}
                </div>
                <div className="mt-1.5 font-mono text-[15px] font-medium tabular-nums text-[var(--b23-fg-2)]">
                  {pesoCompact(s.value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <SmallKpi label="Active members" value={String(activeMembers)} delta={activeMembersDelta} deltaHint="from last month" />
        <SmallKpi label="Today's check-ins" value={String(todayCheckins)} delta={checkinsDelta} deltaHint="vs. yesterday" />
        <SmallKpi label="MTD revenue" value={pesoCompact(mtdRevenue)} delta={pctDelta(mtdPct)} deltaHint="vs. last month" compact />
        <SmallKpi
          label="Expiring soon"
          value={String(donutExpiring)}
          sub={`within next ${thresholds.expirationWarningDays} days`}
          accent={donutExpiring > 0 ? "warning" : undefined}
          icon={CalendarClock}
        />
        <SmallKpi
          label="Inventory value"
          value={pesoCompact(valuation.total)}
          sub={valuation.excludedCount > 0 ? `${valuation.excludedCount} excluded — no cost price` : undefined}
          compact
        />
      </div>

      {/* ── Charts row A: revenue trend + membership status ── */}
      <div className="grid gap-3.5 lg:grid-cols-3">
        <div className={`${PANEL} lg:col-span-2`}>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">Revenue trend</h2>
              <p className="mt-1 text-xs text-muted-foreground">Daily revenue by source</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Legend swatch="line" color="var(--chart-1)" label="Membership" />
              <Legend swatch="line" color="var(--chart-2)" label="Product" />
              <Legend swatch="line" color="var(--chart-3)" label="Walk-in" />
            </div>
          </div>
          <RevenueTrendChart data={revenueTrend} />
        </div>

        <div className={PANEL}>
          <h2 className="font-display text-base font-semibold text-foreground">Membership status</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{membersTotal} members</p>
          <MembershipDonutChart data={donutData} />
          <div className="mt-1.5 flex flex-col gap-2.5">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full" style={{ background: d.fill }} />
                <span className="text-[13px] font-medium text-[var(--b23-fg-2)]">{d.name}</span>
                <span className="ml-auto font-mono text-[13px] font-medium tabular-nums text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts row B: daily attendance + top products ── */}
      <div className="grid gap-3.5 lg:grid-cols-3">
        <div className={`${PANEL} lg:col-span-2`}>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">Daily attendance</h2>
              <p className="mt-1 text-xs text-muted-foreground">Member vs. walk-in check-ins</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Legend swatch="dot" color="var(--chart-1)" label="Member" />
              <Legend swatch="dot" color="var(--chart-3)" label="Walk-in" />
            </div>
          </div>
          <DailyAttendanceChart data={dailyAttendance} />
        </div>

        <div className={PANEL}>
          <h2 className="mb-4 font-display text-sm font-semibold text-foreground">Top products</h2>
          {topProducts.length === 0 ? (
            <FeedEmpty>No product sales in this period.</FeedEmpty>
          ) : (
            <div className="flex flex-col gap-3.5">
              {topProducts.map((p) => (
                <div key={p.name}>
                  <div className="mb-1.5 flex justify-between gap-3">
                    <span className="truncate text-[12.5px] font-medium text-[var(--b23-fg-2)]">{p.name}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{p.qty}</span>
                  </div>
                  <div className="h-[7px] overflow-hidden rounded-full bg-[var(--b23-surface-3)]">
                    <div
                      className="h-full rounded-full bg-[image:var(--b23-grad-primary)]"
                      style={{ width: `${Math.round((p.qty / topMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Live-feed panels ── */}
      <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        <Panel title="Today's Collections" href="/payments?view=collections">
          {collections.lines.map((l) => {
            const Icon = METHOD_ICON[l.method] ?? Wallet;
            return (
              <div key={l.method} className="flex items-center gap-2.5">
                <Icon className="size-[15px] shrink-0 text-muted-foreground" aria-hidden />
                <span className="text-[13px] text-[var(--b23-fg-2)]">{l.label}</span>
                <span className="ml-auto font-mono text-xs text-[var(--b23-faint)]">{l.count}</span>
                <span className="w-[92px] text-right font-mono text-[13px] font-medium tabular-nums text-foreground">
                  {peso(l.total)}
                </span>
              </div>
            );
          })}
          <div className="mt-1 flex items-center gap-2.5 border-t pt-3">
            <span className="text-[13px] font-semibold text-foreground">Grand total</span>
            <span className="ml-auto font-mono text-xs text-[var(--b23-faint)]">{collections.grandCount}</span>
            <span className="w-[92px] text-right font-mono text-sm font-semibold tabular-nums text-[var(--b23-accent-light)]">
              {peso(collections.grandTotal)}
            </span>
          </div>
        </Panel>

        <Panel title="Expiring soon" href="/clients?chip=expiring-soon">
          {expiringList.length === 0 ? (
            <FeedEmpty>No memberships expiring soon.</FeedEmpty>
          ) : (
            expiringList.slice(0, 4).map((m) => (
              <PersonRow
                key={m.id}
                href={`/clients/${m.id}`}
                name={m.name}
                sub={m.expiry ? `Expires ${formatDateOnly(m.expiry)}` : ""}
                pill={m.days !== null ? `${m.days} day${m.days === 1 ? "" : "s"}` : "—"}
                pillTone={m.days !== null && m.days < 7 ? "danger" : "warning"}
              />
            ))
          )}
        </Panel>

        <Panel title="Inventory alerts" href="/inventory">
          {lowStock.length === 0 ? (
            <FeedEmpty>All products are above their low-stock threshold.</FeedEmpty>
          ) : (
            lowStock.map((p) => {
              const out = p.stock <= 0;
              return (
                <div key={p.id} className="flex items-center gap-2.5">
                  <AlertTriangle
                    className="size-[15px] shrink-0"
                    strokeWidth={2}
                    aria-hidden
                    style={{ color: out ? TONE.danger : TONE.warning }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-foreground">{p.name}</div>
                    <div className="font-mono text-[11px] text-[var(--b23-faint)]">
                      {p.stock.toLocaleString("en-PH")}
                      {p.isServing ? " servings" : " units"}
                      {p.eta === null ? " · no recent sales" : ` · ~${Math.floor(p.eta)} days left`}
                    </div>
                  </div>
                  <Tag tone={out ? "danger" : "warning"}>{out ? "OUT" : "LOW"}</Tag>
                </div>
              );
            })
          )}
        </Panel>

        <Panel title="Recent POS sales" href="/pos?view=history">
          {recentSales.length === 0 ? (
            <FeedEmpty>No product sales yet.</FeedEmpty>
          ) : (
            recentSales.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-foreground">
                    {s.lineItems.map((li) => li.description).join(" · ") || "Sale"}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--b23-faint)]">
                    {PAYMENT_METHOD_LABELS[s.paymentMethod]} · {relativeTime(s.transactionDate, now)}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[13px] font-medium tabular-nums text-foreground">
                  {peso(Number(s.totalAmount))}
                </span>
              </div>
            ))
          )}
        </Panel>

        <Panel title="At-risk members" href="/clients?chip=at-risk" dot="atRisk">
          {atRiskList.length === 0 ? (
            <FeedEmpty>All active members have visited recently.</FeedEmpty>
          ) : (
            atRiskList.slice(0, 4).map((m) => (
              <PersonRow
                key={m.id}
                href={`/clients/${m.id}`}
                name={m.name}
                sub={m.expiry ? `Expires ${formatDateOnly(m.expiry)}` : ""}
                pill={m.days !== null ? `${m.days}d` : "never"}
                pillTone="atRisk"
              />
            ))
          )}
        </Panel>

        <Panel title="Frequent walk-ins" href="/clients?chip=walk-in-only">
          {topFrequent.length === 0 ? (
            <FeedEmpty>No walk-in visits recorded yet.</FeedEmpty>
          ) : (
            topFrequent.map((w) => (
              <PersonRow
                key={w.id}
                href={`/clients/${w.id}`}
                name={w.name}
                sub={w.lastVisit ? `Last ${formatDateOnly(w.lastVisit)}` : "No visits"}
                pill={`${w.visits} visit${w.visits === 1 ? "" : "s"}`}
                pillTone="neutral"
              />
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

function relativeTime(date: Date, now: Date): string {
  const mins = Math.round((now.getTime() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const a = parts[0][0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (a + b).toUpperCase();
}

function Legend({ swatch, color, label }: { swatch: "line" | "dot"; color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--b23-fg-2)]">
      <span
        className={swatch === "line" ? "h-[3px] w-3 rounded-full" : "size-2.5 rounded-full"}
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function SmallKpi({
  label,
  value,
  delta,
  deltaHint,
  sub,
  accent,
  compact,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: { text: string; tone: Tone };
  deltaHint?: string;
  sub?: string;
  accent?: Tone;
  compact?: boolean;
  icon?: typeof CalendarClock;
}) {
  const accentColor = accent ? TONE[accent] : undefined;
  return (
    <div
      className={PANEL}
      style={accentColor ? { borderColor: `color-mix(in srgb, ${accentColor} 22%, var(--b23-border))` } : undefined}
    >
      <div
        className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[var(--b23-track-eyebrow)]"
        style={{ color: accentColor ?? "var(--b23-muted)" }}
      >
        {Icon ? <Icon className="size-3.5" strokeWidth={2.2} aria-hidden /> : null}
        {label}
      </div>
      <div
        className={`mt-2.5 font-display font-semibold tabular-nums text-foreground ${compact ? "text-2xl" : "text-[28px]"}`}
      >
        {value}
      </div>
      {delta ? (
        <div className="mt-2 font-mono text-xs" style={{ color: TONE[delta.tone] }}>
          {delta.text}
          {deltaHint ? <span className="ml-1 font-normal text-[var(--b23-faint)]">{deltaHint}</span> : null}
        </div>
      ) : sub ? (
        <div className="mt-2 font-mono text-[11px] text-[var(--b23-faint)]">{sub}</div>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  href,
  dot,
  children,
}: {
  title: string;
  href?: string;
  dot?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div className={PANEL}>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          {dot ? (
            <span
              className="size-[7px] rounded-full"
              style={{ background: TONE[dot], boxShadow: `0 0 0 3px color-mix(in srgb, ${TONE[dot]} 25%, transparent)` }}
            />
          ) : null}
          {title}
        </h3>
        {href ? (
          <Link href={href} className="text-xs font-medium text-[var(--b23-accent-light)] hover:underline">
            View all →
          </Link>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function PersonRow({
  name,
  sub,
  pill,
  pillTone,
  href,
}: {
  name: string;
  sub: string;
  pill: string;
  pillTone: Tone;
  href: string;
}) {
  return (
    <Link href={href} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-0.5 hover:bg-[color-mix(in_srgb,var(--b23-fg)_5%,transparent)]">
      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--b23-surface-3)] font-display text-[11px] font-semibold text-[var(--b23-fg-2)]">
        {initials(name)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-foreground">{name}</div>
        {sub ? <div className="truncate font-mono text-[11px] text-[var(--b23-faint)]">{sub}</div> : null}
      </div>
      <div className="ml-auto shrink-0">
        <Tag tone={pillTone}>{pill}</Tag>
      </div>
    </Link>
  );
}

function Tag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const c = TONE[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap"
      style={{ color: c, background: `color-mix(in srgb, ${c} 15%, transparent)` }}
    >
      {children}
    </span>
  );
}

function FeedEmpty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground">{children}</p>;
}
