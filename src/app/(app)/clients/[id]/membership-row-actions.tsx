"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, XCircle } from "lucide-react";
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
import { cancelMembership } from "./membership-actions";

// Membership History row overflow → Cancel (US-3.10, Flow 18). A reason is required;
// cancellation is soft (cancelled_at) and independent of payment void (ADR-041).
export function MembershipRowActions({
  clientId,
  membershipId,
  label,
}: {
  clientId: string;
  membershipId: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmCancel() {
    if (reason.trim().length === 0) {
      toast.error("A cancellation reason is required.");
      return;
    }
    startTransition(async () => {
      const res = await cancelMembership(clientId, membershipId, reason);
      if (res.ok) {
        toast.success("Membership cancelled.");
        setOpen(false);
        setReason("");
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
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${label}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={() => setOpen(true)}>
            <XCircle aria-hidden />
            Cancel membership
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setReason("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this membership?</DialogTitle>
            <DialogDescription>
              It will stop granting access and leave the active counts. All
              history is preserved (it stays here with a “Cancelled” badge). This
              does not void the payment — reverse that separately if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="cancel-reason" className="text-sm font-medium">
              Reason
            </label>
            <textarea
              id="cancel-reason"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              rows={3}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Created for the wrong client"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Keep membership
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmCancel}
              disabled={pending}
            >
              {pending ? "Cancelling…" : "Cancel membership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
