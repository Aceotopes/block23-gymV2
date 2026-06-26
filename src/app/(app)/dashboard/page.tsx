import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Dashboard · Block23 Gym",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Daily operational command center."
      />
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="text-foreground">{session?.user.name}</span>
        {session?.user.email ? ` (${session.user.email})` : null}. The KPI strip,
        charts, and live feeds arrive in Milestone 8.
      </p>
    </>
  );
}
