import type { ReactNode } from "react";
import {
  UserCheck,
  User,
  Clock,
  AlertTriangle,
  Circle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberStatus, WalkInStatus } from "@/lib/clients/derive";

// Shared status/type badges (DESIGN-SYSTEM §3.4 / §13.1). Every badge renders its
// LABEL text; the icon/shape is the color-independent signal (ADR-044) — color is
// only reinforcement. Built once here; reused by the Client List, Profile, and
// (later) the Dashboard panels and Reports.

type Tone = "success" | "warning" | "info" | "neutral" | "at-risk" | "primary";

const toneClass: Record<Tone, string> = {
  success: "border-success-on/25 bg-success-on/15 text-success-on",
  warning: "border-warning-on/25 bg-warning-on/15 text-warning-on",
  info: "border-info-on/25 bg-info-on/15 text-info-on",
  "at-risk": "border-at-risk/25 bg-at-risk/15 text-at-risk",
  primary: "border-primary-on/25 bg-primary-on/15 text-primary-on",
  neutral: "border-border bg-muted text-muted-foreground",
};

function Pill({
  tone,
  icon,
  children,
  className,
}: {
  tone: Tone;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3",
        toneClass[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const FilledDot = () => (
  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
);

const HollowDot = () => <Circle aria-hidden />;

const STATUS_CONFIG: Record<
  MemberStatus | WalkInStatus,
  { tone: Tone; label: string; icon: ReactNode }
> = {
  ACTIVE: { tone: "success", label: "Active", icon: <FilledDot /> },
  UPCOMING: { tone: "info", label: "Upcoming", icon: <Clock aria-hidden /> },
  EXPIRING_SOON: {
    tone: "warning",
    label: "Expiring soon",
    icon: <AlertTriangle aria-hidden />,
  },
  EXPIRED: { tone: "neutral", label: "Expired", icon: <HollowDot /> },
  INACTIVE: { tone: "neutral", label: "Inactive", icon: <HollowDot /> },
};

export function StatusBadge({
  status,
  className,
}: {
  status: MemberStatus | WalkInStatus;
  className?: string;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Pill tone={cfg.tone} icon={cfg.icon} className={className}>
      {cfg.label}
    </Pill>
  );
}

export function ClientTypeBadge({
  type,
  className,
}: {
  type: "MEMBER" | "WALK_IN";
  className?: string;
}) {
  return type === "MEMBER" ? (
    <Pill tone="primary" icon={<UserCheck aria-hidden />} className={className}>
      Member
    </Pill>
  ) : (
    <Pill tone="neutral" icon={<User aria-hidden />} className={className}>
      Walk-in
    </Pill>
  );
}

export function AtRiskBadge({ className }: { className?: string }) {
  return (
    <Pill tone="at-risk" icon={<Activity aria-hidden />} className={className}>
      At risk
    </Pill>
  );
}
