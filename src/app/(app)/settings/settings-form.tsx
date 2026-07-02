"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { gymSettingsSchema, type GymSettingsValues } from "./settings-schema";
import { updateGymSettings } from "./actions";
import { TimezoneCombobox } from "./timezone-combobox";

// ── Design-system section header: mono uppercase eyebrow + display title. ──
function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <CardHeader>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[var(--b23-track-eyebrow)] text-muted-foreground">
        {eyebrow}
      </span>
      <CardTitle className="font-display text-xl font-semibold tracking-[var(--b23-track-display)]">
        {title}
      </CardTitle>
      <CardDescription>{children}</CardDescription>
    </CardHeader>
  );
}

// Card shell with the DS resting-card radius + inner catch-light / grounding shadow.
const cardClass =
  "rounded-[var(--b23-radius-2xl)] shadow-[var(--b23-shadow-card)]";

// Primary action: the one violet gradient pill per region (DS non-negotiable).
const primaryBtnClass =
  "rounded-full bg-[image:var(--b23-grad-primary)] shadow-[var(--b23-glow-btn)] hover:brightness-110";

export function SettingsForm({
  defaultValues,
}: {
  defaultValues: GymSettingsValues;
}) {
  const form = useForm<GymSettingsValues>({
    resolver: zodResolver(gymSettingsSchema),
    defaultValues,
  });

  async function onSubmit(values: GymSettingsValues) {
    const res = await updateGymSettings(values);
    if (res.ok) {
      toast.success("Settings saved.");
      form.reset(values);
    } else {
      toast.error(res.error);
    }
  }

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-3xl space-y-6"
        noValidate
      >
        {/* ── Gym Information (US-1.2) ── */}
        <Card className={cardClass}>
          <SectionHeader eyebrow="Identity" title="Gym information">
            Shown throughout the system. The timezone governs how all dates and
            times display and how “today” is calculated.
          </SectionHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gym name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact info</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Phone or email"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field, fieldState }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <TimezoneCombobox
                      id="timezone"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!fieldState.error}
                    />
                  </FormControl>
                  <FormDescription>IANA identifier (ADR-035).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── Pricing (US-1.3) ── */}
        <Card className={cardClass}>
          <SectionHeader eyebrow="Pricing" title="Walk-in fee">
            Pre-fills the walk-in fee at check-in (overridable per visit).
            Changes affect future transactions only — past records are never
            rewritten. Membership pricing is per plan (below).
          </SectionHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="defaultWalkinFee"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Default walk-in fee</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── System Preferences (US-1.4 / 1.7 / 1.8 / 1.9) ── */}
        <Card className={cardClass}>
          <SectionHeader eyebrow="Thresholds" title="System preferences">
            Thresholds that drive status flags and alerts. All recalculate
            immediately on the next query — no backfill. Must be at least 1.
          </SectionHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="expirationWarningDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiring-soon threshold (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min={1}
                      className="font-mono tabular-nums"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Flags members whose membership ends within this window.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="walkinInactivityThresholdDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Walk-in inactivity threshold (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min={1}
                      className="font-mono tabular-nums"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Walk-ins idle beyond this are flagged Inactive.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memberInactivityWarningDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>At-risk member threshold (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min={1}
                      className="font-mono tabular-nums"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Active members not seen within this window are surfaced as
                    at-risk.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="walkinConversionPromptVisits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Walk-in conversion threshold (visits)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min={1}
                      className="font-mono tabular-nums"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Prompts a membership offer once a walk-in reaches this many
                    visits.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className={primaryBtnClass}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
