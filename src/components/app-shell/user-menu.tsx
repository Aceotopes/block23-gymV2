"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Initials for the avatar tile — first letters of up to two words.
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

// User menu in the topbar (DESIGN-SYSTEM §12 / prototype owner chip): violet-tinted
// avatar + name + role, opening the account dropdown. Logout lives here, spatially
// separated from navigation; no destructive action sits in the nav.
export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full outline-none transition-[background-color] hover:bg-[color-mix(in_srgb,var(--b23-fg)_7%,transparent)] focus-visible:ring-[3px] focus-visible:ring-[var(--b23-focus-ring)] sm:pr-1"
        >
          <span className="flex size-[34px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--b23-accent)_35%,var(--b23-border))] bg-[color-mix(in_srgb,var(--b23-accent)_22%,var(--b23-surface-2))] font-display text-xs font-semibold text-[var(--b23-accent-light)]">
            {initials(name)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-40 truncate text-[13px] font-semibold text-foreground">
              {name}
            </span>
            <span className="block font-mono text-[10px] tracking-[0.05em] text-[var(--b23-faint)]">
              {role}
            </span>
          </span>
          <ChevronDown
            className="hidden size-4 text-muted-foreground sm:block"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            Role: {role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={async (e) => {
            e.preventDefault();
            await signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
