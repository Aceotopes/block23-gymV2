"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { RevenueTrendPoint } from "@/lib/revenue/revenue";

// Recharts wrappers for the Dashboard (US-8.1). Colors from the design tokens
// (ADR-049 / DESIGN-TOKENS.MD categorical palette): chart-1 violet = membership,
// chart-2 teal = product, chart-3 amber = walk-in. Legends are rendered by the
// server view (prototype style), not by Recharts. Client components — Recharts needs the DOM.

const axis = { fontSize: 12, stroke: "var(--muted-foreground)" };
const grid = "var(--border)";
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

function peso(value: number): string {
  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={axis}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={axis}
          tickLine={false}
          width={52}
          tickFormatter={(v) => peso(Number(v))}
        />
        <Tooltip
          labelFormatter={(v) => shortDate(String(v))}
          formatter={(v, name) => [peso(Number(v)), name]}
          contentStyle={tooltipStyle}
        />
        <Line type="monotone" dataKey="membership" name="Membership" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="walkin" name="Walk-in" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="product" name="Product" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MembershipDonutChart({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  const empty = data.every((d) => d.value === 0);
  if (empty) {
    return (
      <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
        No members yet
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.fill} stroke="var(--card)" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DailyAttendanceChart({
  data,
}: {
  data: { date: string; member: number; walkin: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={axis}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={axis} tickLine={false} allowDecimals={false} width={32} />
        <Tooltip
          labelFormatter={(v) => shortDate(String(v))}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="member" name="Member" stackId="a" fill="var(--chart-1)" />
        <Bar dataKey="walkin" name="Walk-in" stackId="a" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
