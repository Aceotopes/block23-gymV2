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
        <Card>
          <CardHeader>
            <CardTitle>Gym Information</CardTitle>
            <CardDescription>
              Shown throughout the system. The timezone governs how all dates and
              times display and how “today” is calculated.
            </CardDescription>
          </CardHeader>
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
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>
              Pre-fills the walk-in fee at check-in (overridable per visit).
              Changes affect future transactions only — past records are never
              rewritten. Membership pricing is per plan (Milestone 3).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="defaultWalkinFee"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Default walk-in fee (₱)</FormLabel>
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
          </CardContent>
        </Card>

        {/* ── System Preferences (US-1.4 / 1.7 / 1.8 / 1.9) ── */}
        <Card>
          <CardHeader>
            <CardTitle>System Preferences</CardTitle>
            <CardDescription>
              Thresholds that drive status flags and alerts. All recalculate
              immediately on the next query — no backfill. Must be at least 1.
            </CardDescription>
          </CardHeader>
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
                      className="tabular-nums"
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
                      className="tabular-nums"
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
                      className="tabular-nums"
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
                      className="tabular-nums"
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
