import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REPORT_GROUPS, REPORTS } from "./registry";

export const metadata = { title: "Reports · Block23 Gym" };

// Reports index (IA §7) — links every report grouped by domain. Reports ship across
// Milestone 8 Parts 2–4; unimplemented ones show a "Coming soon" badge until they land.
export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Archival, exportable reports across every module. Each report exports to CSV."
      />
      <div className="space-y-8">
        {REPORT_GROUPS.map((group) => {
          const reports = REPORTS.filter((r) => r.group === group);
          return (
            <section key={group} className="space-y-3">
              <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {group}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reports.map((r) =>
                  r.implemented ? (
                    <Link key={r.slug} href={`/reports/${r.slug}`} className="group block">
                      <Card className="hover:border-primary/50 h-full transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between gap-2 text-sm">
                            {r.title}
                            <ArrowRight
                              className="text-muted-foreground group-hover:text-primary size-4 shrink-0"
                              aria-hidden
                            />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm">{r.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <Card key={r.slug} className="h-full opacity-60">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between gap-2 text-sm">
                          {r.title}
                          <Badge variant="outline" className="text-muted-foreground shrink-0">
                            Soon
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">{r.description}</p>
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
