"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { correctAttendanceTime } from "./actions";

// Same-day `time_in` correction (US-4.11, Flow 15). Only shown for same-day records
// (the caller decides via `editable`); only time_in is editable; a reason is
// required; on save `updated_at` is set (the sole marker of a corrected record).
export function AttendanceCorrection({
  attendanceId,
  clientName,
  currentTime,
}: {
  attendanceId: string;
  clientName: string;
  /** current time_in as HH:mm */
  currentTime: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(currentTime);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  function reset() {
    setTime(currentTime);
    setReason("");
  }

  async function submit() {
    if (reason.trim().length === 0) {
      toast.error("A reason is required.");
      return;
    }
    setPending(true);
    const res = await correctAttendanceTime({
      attendanceId,
      timeIn: time,
      reason,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Check-in time updated.");
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit check-in time for ${clientName}`}
        onClick={() => setOpen(true)}
      >
        <Pencil aria-hidden />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Correct check-in time</DialogTitle>
            <DialogDescription>
              Editing {clientName}&apos;s check-in time from{" "}
              <span className="tabular-nums">{currentTime}</span>. Only the time
              can change, and a reason is required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="correct-time" className="text-sm font-medium">
                New time
              </label>
              <Input
                id="correct-time"
                type="time"
                className="w-40 tabular-nums"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="correct-reason" className="text-sm font-medium">
                Reason
              </label>
              <textarea
                id="correct-reason"
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Logged 10 minutes late"
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
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? "Saving…" : "Update time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
