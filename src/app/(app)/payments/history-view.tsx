import Link from "next/link";
import { Ban, Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTimeInTz } from "@/lib/dates";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payments/method";
import {
  VOID_REASON_LABELS,
  type VoidReasonCategory,
} from "@/lib/payments/void";
import { PaymentFilters, type MethodFilter } from "./payment-filters";
import { PaymentVoidAction } from "./void-action";
import type { DatePreset } from "@/lib/attendance/history";

export type PaymentRow = {
  id: string;
  transactionDate: Date;
  clientId: string | null;
  clientName: string;
  itemType: "MEMBERSHIP" | "WALK_IN_FEE";
  description: string;
  feeOverrideNote: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  voided: boolean;
  voidReasonCategory: VoidReasonCategory | null;
  voidReasonNote: string | null;
};

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Client Payment History (US-5.2) — chronological CLIENT_TRANSACTION list for the
// selected range, filterable by date / payment method / client name (URL state,
// ADR-047). Voided rows stay visible with a VOID badge + reason; COMPLETED rows
// offer the additive void action (US-5.3, Flow 11).
export function HistoryView({
  rows,
  timezone,
  preset,
  method,
  q,
  from,
  to,
}: {
  rows: PaymentRow[];
  timezone: string;
  preset: DatePreset;
  method: MethodFilter;
  q: string;
  from: string;
  to: string;
}) {
  return (
    <div className="space-y-4">
      <PaymentFilters preset={preset} method={method} q={q} from={from} to={to} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments in this range"
          description="Membership and walk-in payments appear here. Adjust the date range, method, or name filter."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className={r.voided ? "text-muted-foreground" : ""}>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {formatDateTimeInTz(r.transactionDate, timezone)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {r.clientId ? (
                      <Link
                        href={`/clients/${r.clientId}`}
                        className="hover:underline"
                      >
                        {r.clientName}
                      </Link>
                    ) : (
                      r.clientName
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        {r.itemType === "WALK_IN_FEE" ? "Walk-in fee" : "Membership"}
                      </span>
                      {r.feeOverrideNote ? (
                        <span className="text-muted-foreground text-xs">
                          {r.feeOverrideNote}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[r.paymentMethod]}</TableCell>
                  <TableCell
                    className={
                      r.voided
                        ? "text-right font-mono tabular-nums line-through"
                        : "text-right font-mono tabular-nums"
                    }
                  >
                    {peso(r.amount)}
                  </TableCell>
                  <TableCell>
                    {r.voided ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="outline" className="text-danger-on w-fit">
                          <Ban aria-hidden /> VOID
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {r.voidReasonCategory
                            ? VOID_REASON_LABELS[r.voidReasonCategory]
                            : ""}
                          {r.voidReasonNote ? ` — ${r.voidReasonNote}` : ""}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-success-on w-fit">
                        Completed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.voided ? null : (
                      <PaymentVoidAction
                        transactionId={r.id}
                        label={`${r.clientName} · ${peso(r.amount)}`}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
