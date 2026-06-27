"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, UserPlus, CalendarClock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientTypeBadge } from "@/components/status-badge";
import { formatDateOnlyISO } from "@/lib/dates";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payments/method";
import {
  searchClientsForCheckIn,
  checkInClient,
  type CheckInSearchResult,
} from "./actions";
import { createClient } from "../clients/actions";

type FeeTarget = {
  id: string;
  fullName: string;
  defaultWalkinFee: number;
  checkedInTodayAt: string | null;
};

type Flow =
  | { kind: "none" }
  | { kind: "duplicate"; client: CheckInSearchResult }
  | { kind: "expired"; client: CheckInSearchResult }
  | { kind: "upcoming"; client: CheckInSearchResult }
  | { kind: "conversion"; client: CheckInSearchResult }
  | { kind: "fee"; client: FeeTarget }
  | { kind: "quickCreate" };

export function CheckInView({
  conversionThreshold,
  defaultWalkinFee,
}: {
  conversionThreshold: number;
  defaultWalkinFee: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CheckInSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [flow, setFlow] = useState<Flow>({ kind: "none" });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced live search.
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let active = true;
    const handle = setTimeout(async () => {
      const r = await searchClientsForCheckIn(q);
      if (active) {
        setResults(r);
        setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  function afterCheckIn() {
    setFlow({ kind: "none" });
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
    router.refresh();
  }

  async function doCheckIn(
    client: { id: string; fullName: string },
    visitType: "MEMBER" | "WALK_IN",
    membershipId: string | null,
    feeCharged: number | null,
    paymentMethod: PaymentMethod | null,
    expiry?: { expiringSoon: boolean; days: number | null },
  ) {
    setPending(true);
    const res = await checkInClient({
      clientId: client.id,
      visitType,
      membershipId,
      feeCharged,
      paymentMethod,
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${client.fullName} checked in.`);
    // Non-blocking expiry warning (US-4.1).
    if (expiry?.expiringSoon) {
      toast.warning(
        `${client.fullName}'s membership expires in ${expiry.days} day${
          expiry.days === 1 ? "" : "s"
        }.`,
        {
          action: {
            label: "Renew",
            onClick: () => router.push(`/clients/${client.id}`),
          },
        },
      );
    }
    afterCheckIn();
  }

  function startCheckIn(client: CheckInSearchResult) {
    switch (client.branch) {
      case "active-member":
        if (client.checkedInTodayAt) {
          setFlow({ kind: "duplicate", client });
        } else {
          void doCheckIn(client, "MEMBER", client.activeMembershipId, null, null, {
            expiringSoon: client.expiringSoon,
            days: client.daysUntilExpiry,
          });
        }
        break;
      case "expired-member":
        setFlow({ kind: "expired", client });
        break;
      case "upcoming-member":
        setFlow({ kind: "upcoming", client });
        break;
      case "walk-in":
        if (client.totalVisits >= conversionThreshold) {
          setFlow({ kind: "conversion", client });
        } else {
          setFlow({ kind: "fee", client: toFeeTarget(client) });
        }
        break;
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xl">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a client by name to check in…"
          aria-label="Search clients to check in"
          autoComplete="off"
          className="pl-9"
        />
      </div>

      {query.trim().length > 0 ? (
        <div className="max-w-xl space-y-2">
          {searching && results.length === 0 ? (
            <p className="text-muted-foreground text-sm">Searching…</p>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <p className="text-muted-foreground text-sm">
                  No active client matches “{query.trim()}”.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFlow({ kind: "quickCreate" })}
                >
                  <UserPlus aria-hidden />
                  New walk-in
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {results.map((c) => (
                <ResultCard key={c.id} client={c} onCheckIn={() => startCheckIn(c)} />
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFlow({ kind: "quickCreate" })}
              >
                <UserPlus aria-hidden />
                Not listed? Add a walk-in
              </Button>
            </>
          )}
        </div>
      ) : null}

      {/* ── Dialogs ── */}
      <DuplicateDialog
        flow={flow}
        pending={pending}
        onCancel={() => setFlow({ kind: "none" })}
        onConfirm={(client) =>
          doCheckIn(client, "MEMBER", client.activeMembershipId, null, null, {
            expiringSoon: client.expiringSoon,
            days: client.daysUntilExpiry,
          })
        }
      />

      <ExpiredDialog
        flow={flow}
        onCancel={() => setFlow({ kind: "none" })}
        onWalkIn={(client) => setFlow({ kind: "fee", client: toFeeTarget(client) })}
        onRenew={(client) => router.push(`/clients/${client.id}`)}
      />

      <UpcomingDialog
        flow={flow}
        onCancel={() => setFlow({ kind: "none" })}
        onContinue={(client) =>
          setFlow({ kind: "fee", client: toFeeTarget(client) })
        }
      />

      <ConversionDialog
        flow={flow}
        threshold={conversionThreshold}
        onCancel={() => setFlow({ kind: "none" })}
        onRegister={(client) => router.push(`/clients/${client.id}`)}
        onWalkIn={(client) => setFlow({ kind: "fee", client: toFeeTarget(client) })}
      />

      <FeeDialog
        flow={flow}
        pending={pending}
        onCancel={() => setFlow({ kind: "none" })}
        onConfirm={(client, fee, method) =>
          doCheckIn(client, "WALK_IN", null, fee, method)
        }
      />

      <QuickCreateDialog
        flow={flow}
        defaultWalkinFee={defaultWalkinFee}
        onCancel={() => setFlow({ kind: "none" })}
        onCreated={(client) => setFlow({ kind: "fee", client })}
      />
    </div>
  );
}

function toFeeTarget(c: CheckInSearchResult): FeeTarget {
  return {
    id: c.id,
    fullName: c.fullName,
    defaultWalkinFee: c.defaultWalkinFee,
    checkedInTodayAt: c.checkedInTodayAt,
  };
}

function ResultCard({
  client,
  onCheckIn,
}: {
  client: CheckInSearchResult;
  onCheckIn: () => void;
}) {
  const actionLabel =
    client.branch === "active-member"
      ? client.checkedInTodayAt
        ? "Check in again"
        : "Check in"
      : client.branch === "expired-member"
        ? "Check in / renew"
        : "Check in (walk-in)";

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{client.fullName}</span>
            <ClientTypeBadge
              type={client.branch === "walk-in" ? "WALK_IN" : "MEMBER"}
            />
            {client.checkedInTodayAt ? (
              <span className="text-info-on text-xs">
                ✓ in today {client.checkedInTodayAt}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            {client.branch === "active-member"
              ? client.expiringSoon
                ? `Expiring soon · ends ${formatDateOnlyISO(client.membershipEndDate)}`
                : `Active · ends ${formatDateOnlyISO(client.membershipEndDate)}`
              : client.branch === "expired-member"
                ? `Membership expired ${formatDateOnlyISO(client.membershipEndDate)}`
                : client.branch === "upcoming-member"
                  ? `Membership starts ${formatDateOnlyISO(client.upcomingStartDate)}`
                  : `Walk-in · ${client.totalVisits} visit${
                      client.totalVisits === 1 ? "" : "s"
                    }`}
          </p>
        </div>
        <Button size="sm" onClick={onCheckIn}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function DuplicateDialog({
  flow,
  pending,
  onCancel,
  onConfirm,
}: {
  flow: Flow;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (client: CheckInSearchResult) => void;
}) {
  const open = flow.kind === "duplicate";
  const client = flow.kind === "duplicate" ? flow.client : null;
  return (
    <Dialog open={open} onOpenChange={(n) => !n && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check in again?</DialogTitle>
          <DialogDescription>
            {client?.fullName} already checked in today at{" "}
            {client?.checkedInTodayAt}. This will record a second visit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => client && onConfirm(client)} disabled={pending}>
            {pending ? "Checking in…" : "Check in again"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpiredDialog({
  flow,
  onCancel,
  onWalkIn,
  onRenew,
}: {
  flow: Flow;
  onCancel: () => void;
  onWalkIn: (client: CheckInSearchResult) => void;
  onRenew: (client: CheckInSearchResult) => void;
}) {
  const open = flow.kind === "expired";
  const client = flow.kind === "expired" ? flow.client : null;
  return (
    <Dialog open={open} onOpenChange={(n) => !n && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client?.fullName}&apos;s membership has expired</DialogTitle>
          <DialogDescription>
            Membership expired {formatDateOnlyISO(client?.membershipEndDate ?? null)}.
            Check in as a walk-in, or renew the membership now.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => client && onWalkIn(client)}>
            Check in as walk-in (₱{client?.defaultWalkinFee.toFixed(2)})
          </Button>
          <Button onClick={() => client && onRenew(client)}>
            Renew membership now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpcomingDialog({
  flow,
  onCancel,
  onContinue,
}: {
  flow: Flow;
  onCancel: () => void;
  onContinue: (client: CheckInSearchResult) => void;
}) {
  const open = flow.kind === "upcoming";
  const client = flow.kind === "upcoming" ? flow.client : null;
  return (
    <Dialog open={open} onOpenChange={(n) => !n && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5" aria-hidden />
            Membership hasn&apos;t started yet
          </DialogTitle>
          <DialogDescription>
            {client?.fullName}&apos;s membership starts{" "}
            {formatDateOnlyISO(client?.upcomingStartDate ?? null)}. They&apos;ll be
            checked in as a walk-in today.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => client && onContinue(client)}>
            Continue as walk-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConversionDialog({
  flow,
  threshold,
  onCancel,
  onRegister,
  onWalkIn,
}: {
  flow: Flow;
  threshold: number;
  onCancel: () => void;
  onRegister: (client: CheckInSearchResult) => void;
  onWalkIn: (client: CheckInSearchResult) => void;
}) {
  const open = flow.kind === "conversion";
  const client = flow.kind === "conversion" ? flow.client : null;
  void threshold;
  return (
    <Dialog open={open} onOpenChange={(n) => !n && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Offer a membership?</DialogTitle>
          <DialogDescription>
            {client?.fullName} has visited {client?.totalVisits} times without a
            membership. Register them as a member now?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => client && onWalkIn(client)}>
            No, walk-in fee
          </Button>
          <Button onClick={() => client && onRegister(client)}>
            Register as member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FeeDialog({
  flow,
  pending,
  onCancel,
  onConfirm,
}: {
  flow: Flow;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (client: FeeTarget, fee: number, method: PaymentMethod) => void;
}) {
  const open = flow.kind === "fee";
  const client = flow.kind === "fee" ? flow.client : null;
  const [fee, setFee] = useState<number>(Number.NaN);
  const [method, setMethod] = useState<PaymentMethod>("CASH");

  useEffect(() => {
    if (client) {
      setFee(client.defaultWalkinFee);
      setMethod("CASH");
    }
  }, [client]);

  return (
    <Dialog open={open} onOpenChange={(n) => !n && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Walk-in fee</DialogTitle>
          <DialogDescription>
            Recording a walk-in visit for {client?.fullName}. This records the visit
            and the fee payment (US-5.1).
          </DialogDescription>
        </DialogHeader>

        {client?.checkedInTodayAt ? (
          <p className="text-warning-on flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4" aria-hidden />
            Already checked in today at {client.checkedInTodayAt} — this is a repeat
            visit.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label htmlFor="walkin-fee" className="text-sm font-medium">
              Fee (₱)
            </label>
            <Input
              id="walkin-fee"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              className="w-40 font-mono tabular-nums"
              value={Number.isNaN(fee) ? "" : fee}
              onChange={(e) => setFee(e.target.valueAsNumber)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment method</label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              client && onConfirm(client, Number.isNaN(fee) ? 0 : fee, method)
            }
            disabled={pending}
          >
            {pending ? "Checking in…" : "Check in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuickCreateDialog({
  flow,
  defaultWalkinFee,
  onCancel,
  onCreated,
}: {
  flow: Flow;
  defaultWalkinFee: number;
  onCancel: () => void;
  onCreated: (client: FeeTarget) => void;
}) {
  const open = flow.kind === "quickCreate";
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [pending, setPending] = useState(false);
  const [dupConfirm, setDupConfirm] = useState(false);

  function reset() {
    setFullName("");
    setContactNumber("");
    setDupConfirm(false);
  }

  async function submit(force: boolean) {
    if (fullName.trim().length === 0) {
      toast.error("A name is required.");
      return;
    }
    setPending(true);
    const res = await createClient(
      { fullName, contactNumber, email: "", notes: "" },
      force,
    );
    setPending(false);
    if (res.ok) {
      reset();
      onCreated({
        id: res.id,
        fullName: fullName.trim(),
        defaultWalkinFee,
        checkedInTodayAt: null,
      });
      return;
    }
    if ("duplicates" in res) {
      setDupConfirm(true);
      return;
    }
    toast.error(res.error);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(n) => {
        if (!n) {
          reset();
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New walk-in</DialogTitle>
          <DialogDescription>
            Quick-create a lightweight client. Only a name is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="qc-name" className="text-sm font-medium">
              Full name
            </label>
            <Input
              id="qc-name"
              autoFocus
              autoComplete="off"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="qc-contact" className="text-sm font-medium">
              Contact number{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="qc-contact"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>

          {dupConfirm ? (
            <p
              role="alert"
              className="border-warning-on/30 bg-warning-on/10 text-muted-foreground rounded-md border p-3 text-sm"
            >
              A client with a similar name already exists. Create a new one anyway?
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onCancel();
            }}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={() => submit(dupConfirm)} disabled={pending}>
            {pending
              ? "Saving…"
              : dupConfirm
                ? "Create anyway"
                : "Create & continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
