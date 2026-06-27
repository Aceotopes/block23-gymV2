"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  VOID_REASON_CATEGORIES,
  VOID_REASON_LABELS,
  type VoidReasonCategory,
} from "@/lib/payments/void";
import { voidPosSale } from "./pos-actions";

// Void a POS sale (US-6.10, Flow 11). Required category; note required only for OTHER
// (ADR-028). The reversal is additive — the original SALE ledger rows are preserved
// and a new ADJUSTMENT per line restores stock.
export function PosVoidAction({
  transactionId,
  label,
}: {
  transactionId: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<VoidReasonCategory | "">("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const noteRequired = category === "OTHER";

  function reset() {
    setCategory("");
    setNote("");
  }

  function confirmVoid() {
    if (category === "") {
      toast.error("Select a void reason.");
      return;
    }
    if (noteRequired && note.trim().length === 0) {
      toast.error("A detail note is required when the reason is Other.");
      return;
    }
    startTransition(async () => {
      const res = await voidPosSale({ transactionId, category, note });
      if (res.ok) {
        toast.success("Sale voided — stock restored.");
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${label}`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={() => setOpen(true)}>
            <Ban aria-hidden />
            Void sale
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Void this sale?</DialogTitle>
            <DialogDescription>
              {label}. The record is preserved with a VOID badge and excluded from
              revenue; stock sold is restored to inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as VoidReasonCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a void reason" />
                </SelectTrigger>
                <SelectContent>
                  {VOID_REASON_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {VOID_REASON_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="pos-void-note" className="text-sm font-medium">
                Detail note{" "}
                <span className="text-muted-foreground">
                  {noteRequired ? "(required)" : "(optional)"}
                </span>
              </label>
              <textarea
                id="pos-void-note"
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Rang up the wrong item"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Keep sale
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmVoid}
              disabled={pending}
            >
              {pending ? "Voiding…" : "Void sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
