import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Dashboard · Block23 Gym",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="text-foreground">{session?.user.name}</span>
        {session?.user.email ? ` (${session.user.email})` : null}. The KPI strip,
        charts, and live feeds arrive in Milestone 8.
      </p>
    </div>
  );
}
