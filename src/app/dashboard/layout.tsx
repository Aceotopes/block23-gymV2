import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

// Authoritative, server-side session check (TECH-STACK → Authentication
// Standards: middleware is optimistic; the server validates). The full 8-entry
// navigation shell (INFORMATION-ARCHITECTURE.md) is the next Milestone-1 step.
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold">Block23 Gym</span>
          <span className="text-xs text-muted-foreground">Management System</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
