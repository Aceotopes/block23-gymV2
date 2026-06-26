import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Topbar } from "@/components/app-shell/topbar";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { MobileNav } from "@/components/app-shell/mobile-nav";

// Authenticated app shell (DESIGN-SYSTEM §5.4). Wraps every signed-in route via
// the (app) route group. Authoritative server-side session check (the middleware
// is only optimistic — TECH-STACK → Authentication Standards).
export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { name, email } = session.user;
  const role = (session.user as { role?: string }).role ?? "OWNER";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-dvh">
        <Topbar name={name} email={email} role={role} />
        <div className="flex">
          <AppSidebar />
          <main className="min-w-0 flex-1 p-4 pb-20 md:p-6 md:pb-6">
            {children}
          </main>
        </div>
        <MobileNav />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
