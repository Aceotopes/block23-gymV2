// Report registry (Module 8, IA §7). The single source of truth for the Reports index
// and the `/reports/[slug]` dispatch. Reports land across Milestone 8 Parts 2–4; the
// `implemented` flag flips on as each ships (the index links implemented ones and shows
// the rest as "Coming soon"). Slugs are the URL segments.

export const REPORT_GROUPS = [
  "Revenue & financial",
  "Membership",
  "Attendance & clients",
  "Products & inventory",
] as const;

export type ReportGroup = (typeof REPORT_GROUPS)[number];

export type ReportMeta = {
  slug: string;
  title: string;
  description: string;
  group: ReportGroup;
  story: string;
  implemented: boolean;
};

export const REPORTS: ReportMeta[] = [
  // ── Revenue & financial (Part 2, #029) ──
  {
    slug: "revenue",
    title: "Revenue by period & source",
    description:
      "Total revenue broken down by source (membership, walk-in, product), with a per-day breakdown.",
    group: "Revenue & financial",
    story: "US-8.2",
    implemented: true,
  },
  {
    slug: "revenue-by-method",
    title: "Revenue by payment method",
    description:
      "Revenue per payment method (Cash / GCash / Card / Other), spanning client transactions and POS sales.",
    group: "Revenue & financial",
    story: "US-8.3",
    implemented: true,
  },
  {
    slug: "revenue-by-category",
    title: "Revenue by product category",
    description: "Product revenue per category over the selected period.",
    group: "Revenue & financial",
    story: "US-8.4",
    implemented: true,
  },
  {
    slug: "revenue-comparison",
    title: "Period-over-period revenue",
    description:
      "Selected period vs. the equivalent prior period by source, with % change.",
    group: "Revenue & financial",
    story: "US-8.20",
    implemented: true,
  },
  {
    slug: "void-analysis",
    title: "Void analysis",
    description:
      "Voided transactions by reason category and period, spanning both transaction types.",
    group: "Revenue & financial",
    story: "US-8.15",
    implemented: true,
  },

  // ── Membership (Part 3, #030) ──
  {
    slug: "membership-status",
    title: "Membership status lists",
    description: "Active, expiring-soon, and expired members.",
    group: "Membership",
    story: "US-8.6",
    implemented: true,
  },
  {
    slug: "new-vs-renewals",
    title: "New vs. renewals",
    description: "New memberships vs. renewals per period, with renewal rate.",
    group: "Membership",
    story: "US-8.16",
    implemented: true,
  },
  {
    slug: "plan-performance",
    title: "Membership plan performance",
    description: "Per plan — count sold, revenue, and average price paid.",
    group: "Membership",
    story: "US-8.17",
    implemented: true,
  },
  {
    slug: "net-change",
    title: "Membership net change",
    description: "New + renewals − expired per month, with cumulative active count.",
    group: "Membership",
    story: "US-8.19",
    implemented: true,
  },

  // ── Attendance & clients (Part 3, #030) ──
  {
    slug: "attendance",
    title: "Attendance report",
    description:
      "Check-ins per period with member vs. walk-in and unique-visitor breakdowns.",
    group: "Attendance & clients",
    story: "US-8.5",
    implemented: true,
  },
  {
    slug: "member-engagement",
    title: "Member engagement",
    description: "Active members ranked by visit frequency, least engaged first.",
    group: "Attendance & clients",
    story: "US-8.13",
    implemented: true,
  },
  {
    slug: "at-risk-members",
    title: "At-risk members",
    description: "Active members who haven't visited within the threshold.",
    group: "Attendance & clients",
    story: "US-8.14",
    implemented: true,
  },
  {
    slug: "frequent-walk-ins",
    title: "Frequent walk-ins",
    description: "High-visit walk-in clients with no active membership.",
    group: "Attendance & clients",
    story: "US-8.8",
    implemented: true,
  },
  {
    slug: "converted-walk-ins",
    title: "Converted walk-ins",
    description: "Walk-in clients who became members in the period.",
    group: "Attendance & clients",
    story: "US-8.22",
    implemented: true,
  },

  // ── Products & inventory (Part 4, #031) ──
  {
    slug: "best-sellers",
    title: "Best sellers",
    description: "Top products by units/servings sold and by revenue.",
    group: "Products & inventory",
    story: "US-8.7",
    implemented: true,
  },
  {
    slug: "gross-profit",
    title: "Gross profit",
    description: "Revenue − COGS per product, with margin %.",
    group: "Products & inventory",
    story: "US-8.12",
    implemented: true,
  },
  {
    slug: "inventory-usage",
    title: "Inventory usage",
    description: "Stock movements per product with a shrinkage breakdown.",
    group: "Products & inventory",
    story: "US-8.9",
    implemented: true,
  },
  {
    slug: "restock-cost",
    title: "Restock cost",
    description: "Inventory spend per product per period.",
    group: "Products & inventory",
    story: "US-8.18",
    implemented: true,
  },
  {
    slug: "slow-moving",
    title: "Slow-moving / dead stock",
    description: "Active products with no sales in a configurable window.",
    group: "Products & inventory",
    story: "US-8.21",
    implemented: true,
  },
];

export function getReport(slug: string): ReportMeta | undefined {
  return REPORTS.find((r) => r.slug === slug);
}
