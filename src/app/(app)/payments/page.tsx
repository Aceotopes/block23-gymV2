import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import {
  gymToday,
  gymDayStartUtc,
  addDays,
  parseDateOnly,
  toDateInputValue,
} from "@/lib/dates";
import {
  isDatePreset,
  presetRange,
  type DatePreset,
} from "@/lib/attendance/history";
import { isPaymentMethod, type PaymentMethod } from "@/lib/payments/method";
import { summarizeCollections } from "@/lib/payments/collections";
import { PageHeader } from "@/components/page-header";
import { PaymentsNav, type PaymentsViewKey } from "./payments-nav";
import { HistoryView, type PaymentRow } from "./history-view";
import { CollectionsView } from "./collections-view";

export const metadata = { title: "Client Payments · Block23 Gym" };

type MethodFilter = "all" | PaymentMethod;

function asView(value: string | undefined): PaymentsViewKey {
  return value === "collections" ? "collections" : "history";
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  const sp = await searchParams;
  const view = asView(sp.view);
  const today = gymToday(gym.timezone);

  return (
    <>
      <PageHeader
        title="Client Payments"
        description="Membership and walk-in payment history, voids, and collections."
      />
      <PaymentsNav current={view} />

      {view === "history" ? (
        <HistoryContent gymId={gym.id} timezone={gym.timezone} today={today} sp={sp} />
      ) : (
        <CollectionsContent
          gymId={gym.id}
          timezone={gym.timezone}
          today={today}
          sp={sp}
        />
      )}
    </>
  );
}

async function HistoryContent({
  gymId,
  timezone,
  today,
  sp,
}: {
  gymId: string;
  timezone: string;
  today: Date;
  sp: Record<string, string | undefined>;
}) {
  const preset: DatePreset = isDatePreset(sp.preset) ? sp.preset : "last30";
  const method: MethodFilter = isPaymentMethod(sp.method) ? sp.method : "all";
  const q = (sp.q ?? "").trim();
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = presetRange(preset, today, customFrom, customTo);

  // transaction_date is a UTC instant (ADR-035) — bound it to the gym-local day range.
  const startUtc = gymDayStartUtc(timezone, from);
  const endUtc = gymDayStartUtc(timezone, addDays(to, 1));

  const records = await prisma.transaction.findMany({
    where: {
      gymId,
      transactionType: "CLIENT_TRANSACTION",
      transactionDate: { gte: startUtc, lt: endUtc },
      ...(method === "all" ? {} : { paymentMethod: method }),
      ...(q ? { client: { fullName: { contains: q, mode: "insensitive" } } } : {}),
    },
    orderBy: { transactionDate: "desc" },
    take: 500,
    select: {
      id: true,
      transactionDate: true,
      totalAmount: true,
      paymentMethod: true,
      status: true,
      voidReasonCategory: true,
      voidReasonNote: true,
      clientId: true,
      client: { select: { fullName: true } },
      lineItems: {
        select: { itemType: true, description: true, feeOverrideNote: true },
      },
    },
  });

  const rows: PaymentRow[] = records.map((t) => {
    const item = t.lineItems[0];
    return {
      id: t.id,
      transactionDate: t.transactionDate,
      clientId: t.clientId,
      clientName: t.client?.fullName ?? "—",
      itemType: item?.itemType === "WALK_IN_FEE" ? "WALK_IN_FEE" : "MEMBERSHIP",
      description: item?.description ?? "—",
      feeOverrideNote: item?.feeOverrideNote ?? null,
      amount: Number(t.totalAmount),
      paymentMethod: t.paymentMethod,
      voided: t.status === "VOID",
      voidReasonCategory: t.voidReasonCategory,
      voidReasonNote: t.voidReasonNote,
    };
  });

  return (
    <HistoryView
      rows={rows}
      timezone={timezone}
      preset={preset}
      method={method}
      q={q}
      from={sp.from ?? toDateInputValue(from)}
      to={sp.to ?? toDateInputValue(to)}
    />
  );
}

async function CollectionsContent({
  gymId,
  timezone,
  today,
  sp,
}: {
  gymId: string;
  timezone: string;
  today: Date;
  sp: Record<string, string | undefined>;
}) {
  const selected = (sp.date ? parseDateOnly(sp.date) : null) ?? today;
  const startUtc = gymDayStartUtc(timezone, selected);
  const endUtc = gymDayStartUtc(timezone, addDays(selected, 1));

  // Spans BOTH transaction types (ADR-006) — POS_SALE arrives in M6 and is included
  // automatically. Voided transactions are excluded from all totals (US-5.4).
  const rows = await prisma.transaction.findMany({
    where: {
      gymId,
      status: "COMPLETED",
      transactionDate: { gte: startUtc, lt: endUtc },
    },
    select: { paymentMethod: true, totalAmount: true },
  });

  const summary = summarizeCollections(
    rows.map((r) => ({
      paymentMethod: r.paymentMethod,
      totalAmount: Number(r.totalAmount),
    })),
  );

  return (
    <CollectionsView
      summary={summary}
      date={toDateInputValue(selected)}
      maxDate={toDateInputValue(today)}
    />
  );
}
