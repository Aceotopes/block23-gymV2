"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
