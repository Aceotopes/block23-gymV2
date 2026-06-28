import { notFound, redirect } from "next/navigation";
import { getCurrentGym } from "@/lib/gym";
import { gymToday } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { getReport } from "../registry";
import { ReportBackLink, type ReportProps } from "../report-shell";
import { RevenueReport } from "../reports/revenue-report";
import { RevenueByMethodReport } from "../reports/revenue-by-method-report";
import { RevenueByCategoryReport } from "../reports/revenue-by-category-report";
import { RevenueComparisonReport } from "../reports/revenue-comparison-report";
import { VoidAnalysisReport } from "../reports/void-analysis-report";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getReport(slug);
  return { title: `${meta?.title ?? "Report"} · Block23 Gym` };
}

function renderReport(slug: string, props: ReportProps) {
  switch (slug) {
    case "revenue":
      return <RevenueReport {...props} />;
    case "revenue-by-method":
      return <RevenueByMethodReport {...props} />;
    case "revenue-by-category":
      return <RevenueByCategoryReport {...props} />;
    case "revenue-comparison":
      return <RevenueComparisonReport {...props} />;
    case "void-analysis":
      return <VoidAnalysisReport {...props} />;
    default:
      return null;
  }
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const meta = getReport(slug);
  if (!meta || !meta.implemented) notFound();

  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  const rawSp = await searchParams;
  const sp: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(rawSp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const props: ReportProps = {
    gymId: gym.id,
    timezone: gym.timezone,
    today: gymToday(gym.timezone),
    sp,
  };

  const body = renderReport(slug, props);
  if (body === null) notFound();

  return (
    <>
      <ReportBackLink />
      <PageHeader title={meta.title} description={meta.description} />
      {body}
    </>
  );
}
