"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  addDays,
  parseDateOnly,
  formatDateOnly,
  toDateInputValue,
} from "@/lib/dates";
import { computeRenewalDates } from "@/lib/clients/derive";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payments/method";
import { createMembershipSchema, CUSTOM_PLAN } from "./membership-schema";
import {
  createMembership,
  renewMembership,
  type MembershipBlockInfo,
} from "./membership-actions";

export type MembershipAction = "add" | "renew" | "renew-early" | "upcoming-only";

export type ActivePlan = {
  id: string;
  name: string;
  durationDays: number;
  defaultPrice: number;
};

type Props = {
  clientId: string;
  action: MembershipAction;
  activePlans: ActivePlan[];
  /** Greatest end_date among non-cancelled memberships with end_date >= today, else null. */
  renewAnchorEnd: Date | null;
  today: Date;
};

const ACTION_LABEL: Record<MembershipAction, string> = {
  add: "Add membership",
  renew: "Renew",
  "renew-early": "Renew early",
  "upcoming-only": "Membership upcoming",
};

// Form shape covers both modes; startDate is unused in renew mode.
type FormValues = {
  planChoice: string;
  customDays: number | null;
  price: number;
  paymentMethod: PaymentMethod;
  startDate: string;
};

export function MembershipActions({
  clientId,
  action,
  activePlans,
  renewAnchorEnd,
  today,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Intent can switch from create → renew if the create action is blocked by an
  // active membership (US-3.1 "Go to Renew").
  const [mode, setMode] = useState<"create" | "renew">(
    action === "add" ? "create" : "renew",
  );
  const [block, setBlock] = useState<MembershipBlockInfo | null>(null);

  const firstChoice = activePlans[0]?.id ?? CUSTOM_PLAN;
  const initialPrice = activePlans[0]?.defaultPrice ?? Number.NaN;

  // The create schema is a superset (planChoice/customDays/price + startDate, which
  // always carries a valid default) — used for both modes; the server re-validates
  // each path with its own schema. Avoids swapping the resolver on a state change.
  const form = useForm<FormValues>({
    resolver: zodResolver(createMembershipSchema),
    defaultValues: {
      planChoice: firstChoice,
      customDays: null,
      price: initialPrice,
      paymentMethod: "CASH",
      startDate: toDateInputValue(today),
    },
  });

  const planChoice = form.watch("planChoice");
  const customDays = form.watch("customDays");
  const startDateStr = form.watch("startDate");

  function resetForm(nextMode: "create" | "renew") {
    setMode(nextMode);
    setBlock(null);
    form.reset({
      planChoice: firstChoice,
      customDays: null,
      price: initialPrice,
      paymentMethod: "CASH",
      startDate: toDateInputValue(today),
    });
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      resetForm(action === "add" ? "create" : "renew");
    } else {
      setBlock(null);
    }
    setOpen(next);
  }

  function onPlanChange(value: string) {
    form.setValue("planChoice", value, { shouldValidate: false });
    const plan = activePlans.find((p) => p.id === value);
    if (plan) {
      form.setValue("price", plan.defaultPrice, { shouldValidate: false });
      form.setValue("customDays", null);
    }
  }

  // Effective duration for the live preview.
  const selectedPlan = activePlans.find((p) => p.id === planChoice);
  const durationDays =
    planChoice === CUSTOM_PLAN
      ? customDays && customDays > 0
        ? customDays
        : null
      : (selectedPlan?.durationDays ?? null);

  let preview: { startDate: Date; endDate: Date } | null = null;
  if (durationDays) {
    if (mode === "create") {
      const start = parseDateOnly(startDateStr);
      if (start) preview = { startDate: start, endDate: addDays(start, durationDays) };
    } else {
      preview = computeRenewalDates(renewAnchorEnd, durationDays, today);
    }
  }

  async function onSubmit(values: FormValues) {
    if (mode === "create") {
      const res = await createMembership(clientId, {
        planChoice: values.planChoice,
        customDays: values.customDays,
        price: values.price,
        paymentMethod: values.paymentMethod,
        startDate: values.startDate,
      });
      if (res.ok) {
        toast.success("Membership created.");
        handleOpenChange(false);
        router.refresh();
        return;
      }
      if ("block" in res) {
        setBlock(res.block);
        return;
      }
      toast.error(res.error);
      return;
    }

    const res = await renewMembership(clientId, {
      planChoice: values.planChoice,
      customDays: values.customDays,
      price: values.price,
      paymentMethod: values.paymentMethod,
    });
    if (res.ok) {
      toast.success("Membership renewed.");
      handleOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const { isSubmitting } = form.formState;

  if (action === "upcoming-only") {
    return (
      <Button
        disabled
        title="This client's membership hasn't started yet — renewal becomes available once it's active."
      >
        {ACTION_LABEL["upcoming-only"]}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>{ACTION_LABEL[action]}</Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add membership" : "Renew membership"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Select a plan and price. The price is recorded as a snapshot — later plan changes never rewrite it."
                : "The new period is calculated automatically. Renewing while active chains onto the current end date."}
            </DialogDescription>
          </DialogHeader>

          {block ? (
            <div
              role="alert"
              className="border-warning-on/30 bg-warning-on/10 space-y-2 rounded-md border p-3 text-sm"
            >
              <p className="text-warning-on flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4" aria-hidden />
                {block.kind === "active"
                  ? "Already has an active membership"
                  : "Already has an upcoming membership"}
              </p>
              <p className="text-muted-foreground">{block.message}</p>
              {block.kind === "active" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => resetForm("renew")}
                >
                  Renew instead
                </Button>
              ) : null}
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="planChoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select value={field.value} onValueChange={onPlanChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activePlans.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} · {p.durationDays} days
                            </SelectItem>
                          ))}
                          <SelectItem value={CUSTOM_PLAN}>
                            Custom duration (ad-hoc)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {planChoice === CUSTOM_PLAN ? (
                  <FormField
                    control={form.control}
                    name="customDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min={1}
                            className="tabular-nums"
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={
                              field.value == null || Number.isNaN(field.value)
                                ? ""
                                : field.value
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : e.target.valueAsNumber,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {mode === "create" ? (
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={toDateInputValue(today)}
                            className="tabular-nums"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Defaults to today. Can be future-dated (pre-purchase).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="max-w-[12rem]">
                      <FormLabel>Price (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          className="font-mono tabular-nums"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={Number.isNaN(field.value) ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="max-w-[12rem]">
                      <FormLabel>Payment method</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {PAYMENT_METHOD_LABELS[m]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className="text-muted-foreground text-sm">
                  {preview ? (
                    <>
                      Period:{" "}
                      <span className="text-foreground tabular-nums">
                        {formatDateOnly(preview.startDate)} –{" "}
                        {formatDateOnly(preview.endDate)}
                      </span>
                    </>
                  ) : (
                    "Select a plan or enter a duration to see the period."
                  )}
                </p>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving…"
                      : mode === "create"
                        ? "Create membership"
                        : "Renew membership"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
