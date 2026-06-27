"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tags, Plus, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCategory, renameCategory } from "./category-actions";
import type { CategoryOption } from "./products-view";

// Manage product categories (US-6.5, Flow 20) — add + rename inline. No delete at MVP
// (products reference categories). Each mutation re-validates server-side + refreshes.
export function CategoryManager({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    if (newName.trim().length === 0) {
      toast.error("A category name is required.");
      return;
    }
    startTransition(async () => {
      const res = await createCategory(newName);
      if (res.ok) {
        toast.success("Category added.");
        setNewName("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function saveRename(id: string) {
    startTransition(async () => {
      const res = await renameCategory(id, editName);
      if (res.ok) {
        toast.success("Category renamed.");
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Tags aria-hidden />
          Manage categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Product categories</DialogTitle>
          <DialogDescription>
            Group products for the POS grid and reports. Add a category, or rename an
            existing one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">No categories yet.</p>
          ) : (
            categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                {editingId === c.id ? (
                  <>
                    <Input
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(c.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button
                      size="icon-sm"
                      onClick={() => saveRename(c.id)}
                      disabled={pending}
                      aria-label="Save name"
                    >
                      <Check aria-hidden />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Rename ${c.name}`}
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                    >
                      <Pencil aria-hidden />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 border-t pt-3">
          <Input
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
          />
          <Button onClick={add} disabled={pending}>
            <Plus aria-hidden />
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
