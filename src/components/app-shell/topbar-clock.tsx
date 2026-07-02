"use client";

import { useEffect, useState } from "react";

// Live gym-local clock for the topbar (prototype: "Mon, Jun 30 · 7:12 PM" over
// "ASIA / MANILA"). Timezone is the gym's IANA identifier (ADR-035). Renders a
// stable placeholder until mounted so SSR and first client render match.
export function TopbarClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  let stamp = "—";
  if (now) {
    const date = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: timezone,
    }).format(now);
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    }).format(now);
    stamp = `${date} · ${time}`;
  }

  const tzLabel = timezone.replace(/_/g, " ").replace(/\//g, " / ").toUpperCase();

  return (
    <div className="hidden text-right leading-tight sm:block">
      <div className="font-mono text-xs tabular-nums text-[var(--b23-fg-2)]">
        {stamp}
      </div>
      <div className="font-mono text-[10px] tracking-[0.04em] text-[var(--b23-faint)]">
        {tzLabel}
      </div>
    </div>
  );
}
