import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { gymToday, parseDateOnly, toDateInputValue } from "@/lib/dates";
import { summarizeToday, type TodayRow } from "@/lib/attendance/today";
import {
  isDatePreset,
  isVisitTypeFilter,
  presetRange,
  type DatePreset,
  type VisitTypeFilter,
} from "@/lib/attendance/history";
import {
  isAnalyticsPeriod,
  analyticsRange,
  type AnalyticsPeriod,
} from "@/lib/attendance/analytics";
import { PageHeader } from "@/components/page-header";
import { AttendanceNav, type AttendanceViewKey } from "./attendance-nav";
import { CheckInView } from "./check-in-view";
import { TodayCheckIns } from "./today-checkins";
import { HistoryView, type HistoryRow } from "./history-view";
import { AnalyticsView } from "./analytics-view";

export const metadata = { title: "Attendance · Block23 Gym" };

function asView(value: string | undefined): AttendanceViewKey {
  return value === "history" || value === "analytics" ? value : "checkin";
}

export default async function AttendancePage({
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
        title="Attendance"
        description="Record check-ins and review attendance."
      />
      <AttendanceNav current={view} />

      {view === "checkin" ? (
        <CheckInContent
          gymId={gym.id}
          today={today}
          conversionThreshold={gym.walkinConversionPromptVisits}
          defaultWalkinFee={Number(gym.defaultWalkinFee)}
        />
      ) : view === "history" ? (
        <HistoryContent gymId={gym.id} today={today} sp={sp} />
      ) : (
        <AnalyticsContent gymId={gym.id} today={today} sp={sp} gym={gym} />
      )}
    </>
  );
}

async function CheckInContent({
  gymId,
  today,
  conversionThreshold,
  defaultWalkinFee,
}: {
  gymId: string;
  today: Date;
  conversionThreshold: number;
  defaultWalkinFee: number;
}) {
  const todays = await prisma.attendance.findMany({
    where: { gymId, visitDate: today },
    orderBy: { timeIn: "desc" },
    select: {
      id: true,
      clientId: true,
      visitType: true,
      timeIn: true,
      updatedAt: true,
      client: { select: { fullName: true } },
    },
  });
  const rows: TodayRow[] = todays.map((a) => ({
    id: a.id,
    clientId: a.clientId,
    clientName: a.client.fullName,
    visitType: a.visitType,
    timeIn: a.timeIn,
    updatedAt: a.updatedAt,
  }));
  const summary = summarizeToday(rows);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <CheckInView
        conversionThreshold={conversionThreshold}
        defaultWalkinFee={defaultWalkinFee}
      />
      <TodayCheckIns
        total={summary.total}
        unique={summary.unique}
        rows={summary.rows}
      />
    </div>
  );
}

async function HistoryContent({
  gymId,
  today,
  sp,
}: {
  gymId: string;
  today: Date;
  sp: Record<string, string | undefined>;
}) {
  const preset: DatePreset = isDatePreset(sp.preset) ? sp.preset : "today";
  const visitType: VisitTypeFilter = isVisitTypeFilter(sp.type) ? sp.type : "all";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = presetRange(preset, today, customFrom, customTo);

  const records = await prisma.attendance.findMany({
    where: {
      gymId,
      visitDate: { gte: from, lte: to },
      ...(visitType === "all" ? {} : { visitType }),
    },
    orderBy: [{ visitDate: "desc" }, { timeIn: "desc" }],
    take: 500,
    select: {
      id: true,
      visitType: true,
      visitDate: true,
      timeIn: true,
      updatedAt: true,
      client: { select: { fullName: true } },
    },
  });

  const rows: HistoryRow[] = records.map((a) => ({
    id: a.id,
    clientName: a.client.fullName,
    visitType: a.visitType,
    visitDate: a.visitDate,
    timeIn: a.timeIn,
    updatedAt: a.updatedAt,
    isToday: a.visitDate.getTime() === today.getTime(),
  }));

  return (
    <HistoryView
      rows={rows}
      preset={preset}
      visitType={visitType}
      from={sp.from ?? toDateInputValue(from)}
      to={sp.to ?? toDateInputValue(to)}
    />
  );
}

async function AnalyticsContent({
  gymId,
  today,
  sp,
  gym,
}: {
  gymId: string;
  today: Date;
  sp: Record<string, string | undefined>;
  gym: {
    expirationWarningDays: number;
    walkinInactivityThresholdDays: number;
    memberInactivityWarningDays: number;
    walkinConversionPromptVisits: number;
  };
}) {
  const period: AnalyticsPeriod = isAnalyticsPeriod(sp.period)
    ? sp.period
    : "last30";
  const customFrom = sp.from ? parseDateOnly(sp.from) : null;
  const customTo = sp.to ? parseDateOnly(sp.to) : null;
  const { from, to } = analyticsRange(period, today, customFrom, customTo);

  return (
    <AnalyticsView
      gymId={gymId}
      today={today}
      period={period}
      customFrom={customFrom}
      customTo={customTo}
      fromStr={sp.from ?? toDateInputValue(from)}
      toStr={sp.to ?? toDateInputValue(to)}
      thresholds={{
        expirationWarningDays: gym.expirationWarningDays,
        walkinInactivityThresholdDays: gym.walkinInactivityThresholdDays,
        memberInactivityWarningDays: gym.memberInactivityWarningDays,
      }}
      conversionThreshold={gym.walkinConversionPromptVisits}
    />
  );
}
