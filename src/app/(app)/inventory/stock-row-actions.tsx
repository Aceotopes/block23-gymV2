"use client";

import { useState } from "react";
import { MoreHorizontal, PackagePlus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProductType } from "@/lib/products/types";
import { RestockDialog } from "./restock-dialog";
import { AdjustDialog } from "./adjust-dialog";

// Current Stock row overflow → Restock (Flow 9) · Adjust stock (Flow 19). Both open a
// dialog; the server actions move the ledger + cached stock together (ADR-004).
export function StockRowActions({
  productId,
  name,
  productType,
  servingsPerContainer,
  currentStock,
}: {
  productId: string;
  name: string;
  productType: ProductType;
  servingsPerContainer: number | null;
  currentStock: number;
}) {
  const [restockOpen, setRestockOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRestockOpen(true)}>
            <PackagePlus aria-hidden />
            Restock
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAdjustOpen(true)}>
            <SlidersHorizontal aria-hidden />
            Adjust stock
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RestockDialog
        open={restockOpen}
        onOpenChange={setRestockOpen}
        productId={productId}
        name={name}
        productType={productType}
        servingsPerContainer={servingsPerContainer}
      />
      <AdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        productId={productId}
        name={name}
        currentStock={currentStock}
      />
    </>
  );
}
