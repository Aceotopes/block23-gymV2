"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarStore } from "./sidebar-store";

// Desktop primary navigation (DESIGN-SYSTEM §5.4/§12 / Block 23 Console prototype).
// Hidden < md (mobile uses the bottom nav). 240px rail on the warm canvas with a
// hairline right border; MENU eyebrow; active item = violet-tinted fill + violet
// text + left accent bar. Collapses to a 64px icon rail with tooltip labels.
export function AppSidebar() {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <aside
      className={cn(
        "sticky top-[58px] hidden h-[calc(100dvh-58px)] shrink-0 flex-col border-r border-border transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <nav className="flex-1 space-y-[3px] overflow-y-auto p-[14px]">
        {!collapsed && (
          <div className="px-4 pt-1 pb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--b23-faint)]">
            Menu
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-[var(--b23-radius-md)] px-4 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[color-mix(in_srgb,var(--b23-accent)_14%,transparent)] font-medium text-[var(--b23-accent-light)] before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--b23-accent)]"
                  : "text-[var(--b23-fg-2)] hover:bg-[color-mix(in_srgb,var(--b23-fg)_7%,transparent)]",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon
                className="size-[18px] shrink-0"
                strokeWidth={1.7}
                aria-hidden
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <div key={item.href}>{link}</div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full justify-center text-muted-foreground"
        >
          <ChevronLeft
            className={cn("size-4 transition-transform", collapsed && "rotate-180")}
            aria-hidden
          />
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
