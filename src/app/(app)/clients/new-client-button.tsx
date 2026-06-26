"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientFormDialog } from "./client-form-dialog";

export function NewClientButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus aria-hidden />
        New client
      </Button>
      <ClientFormDialog mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
