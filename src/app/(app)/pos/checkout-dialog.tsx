"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payments/method";
import { changeDue, type CartLine } from "@/lib/pos/cart";
import { useCartStore } from "./pos-cart-store";
import { createPosSale, type ForceItem } from "./pos-actions";

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  lines,
  total,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  total: number;
}) {
  const router = useRouter();
  const clear = useCartStore((s) => s.clear);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [cash, setCash] = useState<number>(Number.NaN);
  const [force, setForce] = useState<ForceItem[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setMethod("CASH");
      setCash(Number.NaN);
      setForce(null);
    }
  }, [open]);

  const isCash = method === "CASH";
  const change = changeDue(cash, total);
  const cashShort = isCash && (Number.isNaN(cash) || cash < total);

  async function confirm(forceSale: boolean) {
    setPending(true);
    const res = await createPosSale({
      lines: lines.map((l) => ({
        productId: l.productId,
        mode: l.mode,
        quantity: l.quantity,
      })),
      paymentMethod: method,
      cashReceived: isCash ? cash : null,
      force: forceSale,
    });
    setPending(false);

    if (res.ok) {
      clear();
      toast.success(
        isCash
          ? `Sale recorded — ${peso(res.total)}, change ${peso(
              Math.max(0, cash - res.total),
            )}.`
          : `Sale recorded — ${peso(res.total)}.`,
      );
      onOpenChange(false);
      router.refresh();
      return;
    }
    if ("needsForce" in res) {
      setForce(res.needsForce);
      return;
    }
    toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            {lines.length} line{lines.length === 1 ? "" : "s"} · total{" "}
            <span className="text-foreground font-mono tabular-nums">
              {peso(total)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {force ? (
          <div
            role="alert"
            className="border-warning-on/30 bg-warning-on/10 space-y-2 rounded-md border p-3 text-sm"
          >
            <p className="text-warning-on flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4" aria-hidden />
              Not enough stock
            </p>
            <ul className="text-muted-foreground list-inside list-disc">
              {force.map((f) => (
                <li key={f.name}>
                  {f.name}: only {f.available} in stock, selling {f.requested}.
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              Force the sale anyway? Stock will go negative and a flagged adjustment is
              logged.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment method</label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full">
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

            {isCash ? (
              <div className="space-y-2">
                <label htmlFor="cash-received" className="text-sm font-medium">
                  Cash received (₱)
                </label>
                <Input
                  id="cash-received"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  autoFocus
                  className="font-mono tabular-nums"
                  value={Number.isNaN(cash) ? "" : cash}
                  onChange={(e) => setCash(e.target.valueAsNumber)}
                />
                <p
                  className={
                    cashShort
                      ? "text-warning-on text-sm"
                      : "text-muted-foreground text-sm"
                  }
                >
                  {Number.isNaN(cash)
                    ? "Enter the cash received."
                    : cashShort
                      ? "Cash received is below the total."
                      : `Change: ${peso(change)}`}
                </p>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          {force ? (
            <Button
              variant="destructive"
              onClick={() => confirm(true)}
              disabled={pending}
            >
              {pending ? "Recording…" : "Force sale"}
            </Button>
          ) : (
            <Button onClick={() => confirm(false)} disabled={pending || cashShort}>
              {pending ? "Recording…" : "Confirm sale"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
