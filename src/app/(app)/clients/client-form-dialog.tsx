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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  clientSchema,
  clientFormDefaults,
  type ClientFormValues,
} from "./client-schema";
import { createClient, updateClient, type DuplicateMatch } from "./actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & (
  | { mode: "create"; clientId?: undefined; initialValues?: undefined }
  | { mode: "edit"; clientId: string; initialValues: ClientFormValues }
);

export function ClientFormDialog({
  open,
  onOpenChange,
  mode,
  clientId,
  initialValues,
}: Props) {
  const router = useRouter();
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialValues ?? clientFormDefaults,
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset(initialValues ?? clientFormDefaults);
      setDuplicates(null);
    }
    onOpenChange(next);
  }

  async function submit(values: ClientFormValues, force: boolean) {
    if (mode === "edit") {
      const res = await updateClient(clientId, values);
      if (res.ok) {
        toast.success("Client updated.");
        handleOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
      return;
    }

    const res = await createClient(values, force);
    if (res.ok) {
      toast.success("Client registered.");
      handleOpenChange(false);
      router.refresh();
      return;
    }
    if ("duplicates" in res) {
      // Non-blocking warning (US-2.1) — surface and let the owner confirm.
      setDuplicates(res.duplicates);
      return;
    }
    toast.error(res.error);
  }

  const onSubmit = form.handleSubmit((values) => submit(values, false));
  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit client" : "New client"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update this client's details. Registration date can't be changed."
              : "Register a client. Only a name is required."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Contact number{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="off"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notes{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <textarea
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {duplicates && duplicates.length > 0 ? (
              <div
                role="alert"
                className="border-warning-on/30 bg-warning-on/10 space-y-2 rounded-md border p-3 text-sm"
              >
                <p className="text-warning-on flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-4" aria-hidden />
                  Possible duplicate
                </p>
                <p className="text-muted-foreground">
                  A client with a similar name already exists:{" "}
                  {duplicates.map((d) => d.fullName).join(", ")}. Register
                  anyway?
                </p>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              {duplicates ? (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={form.handleSubmit((values) => submit(values, true))}
                >
                  {isSubmitting ? "Saving…" : "Register anyway"}
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving…"
                    : mode === "edit"
                      ? "Save changes"
                      : "Register client"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
