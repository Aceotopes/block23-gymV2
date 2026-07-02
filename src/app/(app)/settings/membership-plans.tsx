"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Archive,
  ArchiveRestore,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EmptyState } from "@/components/empty-state";
import {
  DURATION_TYPES,
  DURATION_TYPE_LABELS,
  daysToDurationType,
  durationDaysLabel,
} from "@/lib/memberships/duration";
import { planSchema, planFormDefaults, type PlanFormValues } from "./plan-schema";
import { createPlan, updatePlan, retirePlan, reactivatePlan } from "./plan-actions";

export type PlanItem = {
  id: string;
  name: string;
  durationDays: number;
  defaultPrice: number;
  isActive: boolean;
};

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Design-system status pill: label + shape (dot) + fixed status hue — never
// color alone. Active = emerald dot; Inactive = hollow neutral dot.
function PlanStatus({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className="size-1.5 rounded-full bg-[var(--b23-success)]" />
      Active
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
      <span className="size-1.5 rounded-full border-[1.5px] border-[var(--b23-neutral)]" />
      Inactive
    </Badge>
  );
}

const headClass =
  "font-mono text-[11px] uppercase tracking-[var(--b23-track-eyebrow)]";

export function MembershipPlansSection({ plans }: { plans: PlanItem[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Card className="max-w-3xl rounded-[var(--b23-radius-2xl)] shadow-[var(--b23-shadow-card)]">
      <CardHeader>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[var(--b23-track-eyebrow)] text-muted-foreground">
          Catalog
        </span>
        <CardTitle className="font-display text-xl font-semibold tracking-[var(--b23-track-display)]">
          Membership plans
        </CardTitle>
        <CardDescription>
          The plan options offered in the Add/Renew membership flow. Editing a
          plan&apos;s price affects future memberships only — past records keep
          their snapshot. Retired plans stay here and can be reactivated.
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-[image:var(--b23-grad-primary)] shadow-[var(--b23-glow-btn)] hover:brightness-110"
          >
            <Plus aria-hidden />
            Add plan
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No plans yet"
            description="Add your standard 1/2/3-month plans (or a custom duration). Membership purchases can still use an inline custom duration without a saved plan."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={headClass}>Name</TableHead>
                <TableHead className={headClass}>Duration</TableHead>
                <TableHead className={`${headClass} text-right`}>
                  Default price
                </TableHead>
                <TableHead className={headClass}>Status</TableHead>
                <TableHead className="w-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium text-foreground">
                    {plan.name}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-muted-foreground">
                    {durationDaysLabel(plan.durationDays)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {peso(plan.defaultPrice)}
                  </TableCell>
                  <TableCell>
                    <PlanStatus active={plan.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <PlanRowActions plan={plan} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <PlanFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
    </Card>
  );
}

function PlanRowActions({ plan }: { plan: PlanItem }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleRetire() {
    startTransition(async () => {
      const res = plan.isActive
        ? await retirePlan(plan.id)
        : await reactivatePlan(plan.id);
      if (res.ok) {
        toast.success(plan.isActive ? "Plan retired." : "Plan reactivated.");
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
            aria-label={`Actions for ${plan.name}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil aria-hidden />
            Edit plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {plan.isActive ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={toggleRetire}
              disabled={pending}
            >
              <Archive aria-hidden />
              Retire plan
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={toggleRetire} disabled={pending}>
              <ArchiveRestore aria-hidden />
              Reactivate plan
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PlanFormDialog
        mode="edit"
        plan={plan}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & ({ mode: "create"; plan?: undefined } | { mode: "edit"; plan: PlanItem });

function PlanFormDialog({ open, onOpenChange, mode, plan }: DialogProps) {
  const router = useRouter();

  const initial: PlanFormValues =
    mode === "edit"
      ? {
          name: plan.name,
          durationType: daysToDurationType(plan.durationDays),
          customDays:
            daysToDurationType(plan.durationDays) === "CUSTOM"
              ? plan.durationDays
              : null,
          defaultPrice: plan.defaultPrice,
          isActive: plan.isActive,
        }
      : planFormDefaults;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: initial,
  });

  const durationType = form.watch("durationType");

  function handleOpenChange(next: boolean) {
    if (!next) form.reset(initial);
    onOpenChange(next);
  }

  async function onSubmit(values: PlanFormValues) {
    const res =
      mode === "edit"
        ? await updatePlan(plan.id, values)
        : await createPlan(values);
    if (res.ok) {
      toast.success(mode === "edit" ? "Plan updated." : "Plan created.");
      handleOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-[var(--b23-track-display)]">
            {mode === "edit" ? "Edit plan" : "New plan"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Changes apply to future memberships only. Past prices are never rewritten."
              : "Define a reusable membership plan for the Add/Renew flow."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {DURATION_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {durationType === "CUSTOM" ? (
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
                        className="font-mono tabular-nums"
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

            <FormField
              control={form.control}
              name="defaultPrice"
              render={({ field }) => (
                <FormItem className="max-w-[12rem]">
                  <FormLabel>Default price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground"
                      >
                        ₱
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={0}
                        className="pl-7 font-mono tabular-nums"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Overridable at purchase time.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-[image:var(--b23-grad-primary)] shadow-[var(--b23-glow-btn)] hover:brightness-110"
              >
                {isSubmitting
                  ? "Saving…"
                  : mode === "edit"
                    ? "Save changes"
                    : "Create plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
