"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFormDialog } from "./product-form-dialog";
import type { CategoryOption } from "./products-view";

// "New product" entry point — opens the create dialog with the gym's categories. The
// dialog is a client island; the categories list comes from the server view.
export function NewProductButton({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false);
  const disabled = categories.length === 0;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? "Add a category first" : undefined}
      >
        <Plus aria-hidden />
        New product
      </Button>
      {disabled ? null : (
        <ProductFormDialog
          open={open}
          onOpenChange={setOpen}
          mode="create"
          categories={categories}
        />
      )}
    </>
  );
}
