"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { hourLabel } from "@/lib/attendance/analytics";

// Recharts wrappers for the Attendance Analytics view (US-4.10). Colors come from
// the design tokens (DESIGN-SYSTEM §3 chart palette). Client components — Recharts
// needs the DOM.

const axis = { fontSize: 12, stroke: "var(--muted-foreground)" };
const grid = "var(--border)";

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export function DailyTrendChart({
  data,
}: {
  data: { date: string; total: number; unique: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
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
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="total"
          name="Total check-ins"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="unique"
          name="Unique visitors"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DayOfWeekChart({
  data,
}: {
  data: { label: string; avg: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} />
        <YAxis tick={axis} tickLine={false} width={32} />
        <Tooltip
          formatter={(v) => [Number(v).toFixed(1), "Avg check-ins"]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="avg" name="Avg check-ins" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ByHourChart({
  data,
}: {
  data: { hour: number; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis
          dataKey="hour"
          tickFormatter={(h) => hourLabel(Number(h))}
          tick={axis}
          tickLine={false}
          interval={2}
        />
        <YAxis tick={axis} tickLine={false} allowDecimals={false} width={32} />
        <Tooltip
          labelFormatter={(h) => hourLabel(Number(h))}
          formatter={(v) => [v, "Check-ins"]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" name="Check-ins" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
