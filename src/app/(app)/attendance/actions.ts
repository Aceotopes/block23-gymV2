"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentGym, getSessionContext } from "@/lib/gym";
import {
  gymToday,
  gymTimeNow,
  parseTimeOnly,
  formatTimeOnly,
} from "@/lib/dates";
import {
  deriveClient,
  deriveCheckInBranch,
  activeMembershipId,
  type CheckInBranch,
} from "@/lib/clients/derive";
import { isPaymentMethod, type PaymentMethod } from "@/lib/payments/method";

// Attendance mutations + check-in search (Milestone 4 — US-4.1/4.2/4.5/4.8/4.11).
// All scoped by the session gymId (ADR-001/025); writes stamp `created_by` (ADR-021).
//
// Milestone 5 (US-5.1): a WALK_IN check-in now also records a CLIENT_TRANSACTION + a
// single WALK_IN_FEE line item (payment method, fee snapshot, `fee_override_note` when
// the fee differs from `Gym.default_walkin_fee`) atomically with the Attendance.
// Member check-ins create no transaction (they paid at membership purchase). Walk-in
// and membership are always separate transactions (ADR-024), never mixed (ADR-012).

export type CheckInSearchResult = {
  id: string;
  fullName: string;
  branch: CheckInBranch;
  /** in-effect membership to snapshot when checking in a member (null otherwise). */
  activeMembershipId: string | null;
  membershipEndDate: string | null; // ISO date-only, for expiry/expired messaging
  upcomingStartDate: string | null; // ISO date-only, for the upcoming-member notice
  expiringSoon: boolean;
  daysUntilExpiry: number | null;
  totalVisits: number;
  /** today's check-in time (HH:mm) if already checked in, else null (duplicate prompt). */
  checkedInTodayAt: string | null;
  defaultWalkinFee: number;
};

function isoDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/**
 * Live name search for the Check-In Station (US-4.8). Returns active (non-archived)
 * clients with their derived check-in branch + the data each branch needs. Archived
 * clients are excluded (MODULE-SPECS Module 4 — must reactivate first).
 */
export async function searchClientsForCheckIn(
  query: string,
): Promise<CheckInSearchResult[]> {
  const gym = await getCurrentGym();
  if (!gym) return [];
  const q = query.trim();
  if (q.length === 0) return [];

  const today = gymToday(gym.timezone);

  const clients = await prisma.client.findMany({
    where: {
      gymId: gym.id,
      deletedAt: null,
      fullName: { contains: q, mode: "insensitive" },
    },
    orderBy: { fullName: "asc" },
    take: 12,
    select: {
      id: true,
      fullName: true,
      memberships: {
        select: { id: true, startDate: true, endDate: true, cancelledAt: true },
      },
      attendances: {
        orderBy: [{ visitDate: "desc" }, { timeIn: "desc" }],
        select: { visitDate: true, timeIn: true },
      },
    },
  });

  const thresholds = {
    expirationWarningDays: gym.expirationWarningDays,
    walkinInactivityThresholdDays: gym.walkinInactivityThresholdDays,
    memberInactivityWarningDays: gym.memberInactivityWarningDays,
  };
  const fee = Number(gym.defaultWalkinFee);

  return clients.map((c) => {
    const derived = deriveClient({
      memberships: c.memberships,
      lastVisitDate: c.attendances[0]?.visitDate ?? null,
      totalVisits: c.attendances.length,
      today,
      thresholds,
    });
    const branch = deriveCheckInBranch(derived);
    const todayRow = c.attendances.find(
      (a) => a.visitDate.getTime() === today.getTime(),
    );
    const upcoming = c.memberships
      .filter((m) => m.cancelledAt === null && m.startDate.getTime() > today.getTime())
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];

    return {
      id: c.id,
      fullName: c.fullName,
      branch,
      activeMembershipId: activeMembershipId(c.memberships, today),
      membershipEndDate: isoDate(derived.membershipExpiry),
      upcomingStartDate: isoDate(upcoming?.startDate ?? null),
      expiringSoon: derived.expiringSoon,
      daysUntilExpiry: derived.daysUntilExpiry,
      totalVisits: c.attendances.length,
      checkedInTodayAt: todayRow ? formatTimeOnly(todayRow.timeIn) : null,
      defaultWalkinFee: fee,
    };
  });
}

export type CheckInInput = {
  clientId: string;
  visitType: "MEMBER" | "WALK_IN";
  /** required when visitType=MEMBER — the in-effect membership id (snapshot link). */
  membershipId?: string | null;
  /** walk-in fee charged (denormalized display only); null/0 for members. */
  feeCharged?: number | null;
  /** required when visitType=WALK_IN — payment method for the walk-in fee (US-5.1). */
  paymentMethod?: PaymentMethod | null;
};

export type CheckInResult =
  | { ok: true }
  | { ok: false; error: string };

export async function checkInClient(input: CheckInInput): Promise<CheckInResult> {
  const ctx = await getSessionContext();
  if (!ctx) return { ok: false, error: "Not authenticated." };
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  // Confirm the client belongs to the gym and is active.
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, gymId: ctx.gymId, deletedAt: null },
    select: { id: true },
  });
  if (!client) return { ok: false, error: "Client not found." };

  // A MEMBER check-in must snapshot a real, gym-scoped in-effect membership.
  let membershipId: string | null = null;
  if (input.visitType === "MEMBER") {
    if (!input.membershipId) {
      return { ok: false, error: "No active membership to check in." };
    }
    const m = await prisma.membership.findFirst({
      where: { id: input.membershipId, gymId: ctx.gymId, clientId: input.clientId },
      select: { id: true },
    });
    if (!m) return { ok: false, error: "Membership not found." };
    membershipId = m.id;
  }

  const today = gymToday(gym.timezone);
  const timeIn = gymTimeNow(gym.timezone);

  if (input.visitType === "MEMBER") {
    // Member visit: no payment is collected at check-in — record the attendance only.
    await prisma.attendance.create({
      data: {
        gymId: ctx.gymId,
        clientId: input.clientId,
        visitDate: today,
        timeIn,
        visitType: "MEMBER",
        membershipId,
        feeCharged: null,
        createdById: ctx.userId,
      },
    });
  } else {
    // Walk-in visit: the fee + its CLIENT_TRANSACTION (US-5.1) commit with the
    // attendance. Default the fee from the gym setting; note any override (ADR-024).
    if (!isPaymentMethod(input.paymentMethod ?? undefined)) {
      return { ok: false, error: "Select a payment method." };
    }
    const defaultFee = Number(gym.defaultWalkinFee);
    const fee =
      input.feeCharged != null && Number.isFinite(input.feeCharged)
        ? input.feeCharged
        : defaultFee;
    if (fee < 0) return { ok: false, error: "Fee can't be negative." };
    const overrideNote =
      fee !== defaultFee
        ? `Fee adjusted from the ₱${defaultFee.toFixed(2)} default to ₱${fee.toFixed(2)}.`
        : null;

    await prisma.$transaction(async (tx) => {
      await tx.attendance.create({
        data: {
          gymId: ctx.gymId,
          clientId: input.clientId,
          visitDate: today,
          timeIn,
          visitType: "WALK_IN",
          membershipId: null,
          feeCharged: fee,
          createdById: ctx.userId,
        },
      });
      const transaction = await tx.transaction.create({
        data: {
          gymId: ctx.gymId,
          transactionType: "CLIENT_TRANSACTION",
          clientId: input.clientId,
          transactionDate: new Date(),
          totalAmount: fee,
          paymentMethod: input.paymentMethod!,
          createdById: ctx.userId,
        },
      });
      await tx.transactionLineItem.create({
        data: {
          gymId: ctx.gymId,
          transactionId: transaction.id,
          itemType: "WALK_IN_FEE",
          description: "Walk-in fee",
          quantity: 1,
          unitPrice: fee,
          subtotal: fee,
          feeOverrideNote: overrideNote,
        },
      });
    });
  }

  revalidatePath("/attendance");
  revalidatePath(`/clients/${input.clientId}`);
  revalidatePath("/payments");
  return { ok: true };
}

export type CorrectionResult = { ok: true } | { ok: false; error: string };

/**
 * Correct a same-day attendance record's `time_in` (US-4.11, Flow 15). Only
 * `time_in` is editable; a reason note is required; `updated_at` is set on save
 * (the sole marker of a corrected record). Prior-day records are rejected.
 */
export async function correctAttendanceTime(input: {
  attendanceId: string;
  timeIn: string; // HH:mm
  reason: string;
}): Promise<CorrectionResult> {
  const gym = await getCurrentGym();
  if (!gym) return { ok: false, error: "Not authenticated." };

  const reason = input.reason.trim();
  if (reason.length === 0) {
    return { ok: false, error: "A reason is required." };
  }
  const newTime = parseTimeOnly(input.timeIn);
  if (!newTime) return { ok: false, error: "Enter a valid time." };

  const record = await prisma.attendance.findFirst({
    where: { id: input.attendanceId, gymId: gym.id },
    select: { id: true, visitDate: true, clientId: true },
  });
  if (!record) return { ok: false, error: "Record not found." };

  // Same-calendar-day only (gym timezone). Prior-day records are read-only.
  const today = gymToday(gym.timezone);
  if (record.visitDate.getTime() !== today.getTime()) {
    return { ok: false, error: "Records older than today cannot be edited." };
  }

  await prisma.attendance.update({
    where: { id: record.id },
    data: {
      timeIn: newTime,
      correctionNote: reason.slice(0, 500),
      updatedAt: new Date(),
    },
  });

  revalidatePath("/attendance");
  revalidatePath(`/clients/${record.clientId}`);
  return { ok: true };
}
