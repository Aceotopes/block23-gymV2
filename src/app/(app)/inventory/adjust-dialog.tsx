"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADJUSTMENT_REASON_CATEGORIES,
  ADJUSTMENT_REASON_LABELS,
  type AdjustmentReasonCategory,
} from "@/lib/inventory/adjustment";
import { adjustStock } from "./actions";

// Manual stock adjustment (Flow 19, US-7.2). A signed delta with a required owner
// reason (FORCED_SALE is system-only, never listed — ADR-034) and a note required for
// OTHER (ADR-028). A decrease below zero is blocked — record the actual count.
export function AdjustDialog({
  open,
  onOpenChange,
  productId,
  name,
  currentStock,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  productId: string;
  name: string;
  currentStock: number;
}) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [category, setCategory] = useState<AdjustmentReasonCategory | "">("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const deltaNum = Number(delta);
  const deltaValid = delta.trim().length > 0 && Number.isInteger(deltaNum) && deltaNum !== 0;
  const resulting = deltaValid ? currentStock + deltaNum : null;
  const belowZero = resulting !== null && resulting < 0;
  const noteRequired = category === "OTHER";

  function reset() {
    setDelta("");
    setCategory("");
    setNote("");
  }

  function submit() {
    if (!deltaValid) {
      toast.error("Enter a non-zero whole-number adjustment.");
      return;
    }
    if (belowZero) {
      toast.error(`Can't reduce below zero — only ${currentStock} in stock.`);
      return;
    }
    if (category === "") {
      toast.error("Select an adjustment reason.");
      return;
    }
    if (noteRequired && note.trim().length === 0) {
      toast.error("A detail note is required when the reason is Other.");
      return;
    }

    startTransition(async () => {
      const res = await adjustStock({ productId, quantityDelta: deltaNum, category, note });
      if (res.ok) {
        toast.success("Adjustment recorded — stock updated.");
        onOpenChange(false);
        reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock — {name}</DialogTitle>
          <DialogDescription>
            Current stock: {currentStock.toLocaleString("en-PH")}. Use a negative value
            to record a loss, a positive value to correct a count up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adjust-delta">
              Adjustment{" "}
              <span className="text-muted-foreground font-normal">
                (− to decrease, + to increase)
              </span>
            </Label>
            <Input
              id="adjust-delta"
              type="number"
              inputMode="numeric"
              step={1}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. -3"
              className="tabular-nums"
              aria-invalid={belowZero}
            />
            {resulting !== null ? (
              <p
                className={
                  belowZero ? "text-danger-on text-xs" : "text-muted-foreground text-xs"
                }
              >
                {belowZero
                  ? `Resulting stock would be ${resulting.toLocaleString("en-PH")} — below zero is not allowed.`
                  : `Resulting stock: ${resulting.toLocaleString("en-PH")}`}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as AdjustmentReasonCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASON_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {ADJUSTMENT_REASON_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-note">
              Detail note{" "}
              <span className="text-muted-foreground font-normal">
                {noteRequired ? "(required)" : "(optional)"}
              </span>
            </Label>
            <textarea
              id="adjust-note"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. 3 bottles damaged in storage"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending || belowZero}>
            {pending ? "Recording…" : "Record adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
