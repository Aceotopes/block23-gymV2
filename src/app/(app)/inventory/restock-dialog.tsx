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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { restockDelta } from "@/lib/inventory/stock";
import type { ProductType } from "@/lib/products/types";
import { restockProduct } from "./actions";

// Record a restock (Flow 9, US-7.1/7.5). Quantity is units (STANDARD) or containers
// (SERVING_BASED) — the live preview shows the servings that will be added. Optional
// total cost is the whole-invoice amount (not per-unit).
export function RestockDialog({
  open,
  onOpenChange,
  productId,
  name,
  productType,
  servingsPerContainer,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  productId: string;
  name: string;
  productType: ProductType;
  servingsPerContainer: number | null;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [pending, startTransition] = useTransition();

  const isServing = productType === "SERVING_BASED_PRODUCT";
  const qtyNum = Number(quantity);
  const qtyValid = Number.isInteger(qtyNum) && qtyNum >= 1;
  const previewServings =
    isServing && qtyValid
      ? restockDelta(productType, qtyNum, servingsPerContainer)
      : null;

  function reset() {
    setQuantity("");
    setCost("");
  }

  function submit() {
    if (!qtyValid) {
      toast.error("Enter a whole quantity of at least 1.");
      return;
    }
    const trimmedCost = cost.trim();
    const totalRestockCost =
      trimmedCost.length === 0 ? null : Number(trimmedCost);
    if (totalRestockCost !== null && (Number.isNaN(totalRestockCost) || totalRestockCost < 0)) {
      toast.error("Total cost must be a non-negative amount.");
      return;
    }

    startTransition(async () => {
      const res = await restockProduct({
        productId,
        quantityReceived: qtyNum,
        totalRestockCost,
      });
      if (res.ok) {
        toast.success("Restock recorded — stock updated.");
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
          <DialogTitle>Restock {name}</DialogTitle>
          <DialogDescription>
            Records a purchase and raises the stock count. History is preserved in the
            movement ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restock-qty">
              Quantity received{" "}
              <span className="text-muted-foreground font-normal">
                ({isServing ? "containers" : "units"})
              </span>
            </Label>
            <Input
              id="restock-qty"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={isServing ? "e.g. 2 tubs" : "e.g. 24 bottles"}
              className="tabular-nums"
            />
            {previewServings !== null ? (
              <p className="text-muted-foreground text-xs">
                = {previewServings.toLocaleString("en-PH")} servings added
                {servingsPerContainer
                  ? ` (${servingsPerContainer} per container)`
                  : ""}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="restock-cost">
              Total cost paid{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="restock-cost"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Whole invoice amount, e.g. 4800"
              className="tabular-nums"
            />
            <p className="text-muted-foreground text-xs">
              The full amount for this restock — not a per-unit cost.
            </p>
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
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Recording…" : "Record restock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
