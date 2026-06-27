"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductFormDialog } from "./product-form-dialog";
import { archiveProduct, restoreProduct } from "./product-actions";
import type { ProductFormValues } from "./product-schema";
import type { CategoryOption } from "./products-view";

// Product row overflow → Edit · Archive/Restore (Flow 20). Archive is a soft delete
// (ADR-005) — all sales/inventory history is preserved.
export function ProductRowActions({
  productId,
  name,
  archived,
  categories,
  initialValues,
}: {
  productId: string;
  name: string;
  archived: boolean;
  categories: CategoryOption[];
  initialValues: ProductFormValues;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [pending, startTransition] = useTransition();

  function doArchive() {
    startTransition(async () => {
      const res = await archiveProduct(productId);
      if (res.ok) {
        toast.success("Product archived.");
        setConfirmArchive(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function doRestore() {
    startTransition(async () => {
      const res = await restoreProduct(productId);
      if (res.ok) {
        toast.success("Product restored.");
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
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil aria-hidden />
            Edit
          </DropdownMenuItem>
          {archived ? (
            <DropdownMenuItem onSelect={doRestore} disabled={pending}>
              <ArchiveRestore aria-hidden />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirmArchive(true)}
            >
              <Archive aria-hidden />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        productId={productId}
        initialValues={initialValues}
        categories={categories}
      />

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be hidden from the POS grid. All sales and inventory history
              are preserved, and you can restore it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doArchive} disabled={pending}>
              {pending ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
