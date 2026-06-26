"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "@/lib/nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Mobile bottom navigation (DESIGN-SYSTEM §12): the 4 highest-frequency entries
// inline + a "More" sheet for the rest. Hidden at md+ (desktop uses the sidebar).
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const primary = NAV_ITEMS.filter((i) => i.mobile);
  const overflow = NAV_ITEMS.filter((i) => !i.mobile);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-stretch border-t border-border bg-background md:hidden">
      {primary.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
          <MoreHorizontal className="size-5" aria-hidden />
          <span>More</span>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-6">
            {overflow.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md border border-border p-3 text-sm",
                    active
                      ? "bg-accent text-primary"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  <item.icon className="size-5 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
