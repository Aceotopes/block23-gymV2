"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { toast } from "sonner";
import { ClientFormDialog } from "./client-form-dialog";
import { archiveClient, reactivateClient } from "./actions";
import type { ClientFormValues } from "./client-schema";

export type ClientRowActionsData = {
  id: string;
  fullName: string;
  contactNumber: string | null;
  email: string | null;
  notes: string | null;
  archived: boolean;
};

export function ClientRowActions({
  client,
  showView = true,
}: {
  client: ClientRowActionsData;
  showView?: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const initialValues: ClientFormValues = {
    fullName: client.fullName,
    contactNumber: client.contactNumber ?? "",
    email: client.email ?? "",
    notes: client.notes ?? "",
  };

  function confirmArchive() {
    startTransition(async () => {
      const res = await archiveClient(client.id);
      if (res.ok) {
        toast.success(`${client.fullName} archived.`);
        setArchiveOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const res = await reactivateClient(client.id);
      if (res.ok) {
        toast.success(`${client.fullName} reactivated.`);
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
            aria-label={`Actions for ${client.fullName}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showView ? (
            <DropdownMenuItem
              onSelect={() => router.push(`/clients/${client.id}`)}
            >
              <Eye aria-hidden />
              View profile
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil aria-hidden />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {client.archived ? (
            <DropdownMenuItem onSelect={handleReactivate} disabled={pending}>
              <ArchiveRestore aria-hidden />
              Reactivate client
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setArchiveOpen(true)}
            >
              <Archive aria-hidden />
              Archive client
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ClientFormDialog
        mode="edit"
        clientId={client.id}
        initialValues={initialValues}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {client.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be hidden from the active client list. All history is
              preserved, and you can reactivate them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmArchive();
              }}
              disabled={pending}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {pending ? "Archiving…" : "Archive client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
