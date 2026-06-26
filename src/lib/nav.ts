import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown directly in the mobile bottom bar (the 4 highest-frequency). */
  mobile?: boolean;
};

// The 8 top-level entries (INFORMATION-ARCHITECTURE.md §1, ADR-042). Order is
// authoritative for the sidebar. Mobile bottom nav shows the 4 `mobile` entries
// (Dashboard · Clients · Attendance · POS) + a "More" sheet for the rest
// (DESIGN-SYSTEM §12).
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobile: true },
  { label: "Clients", href: "/clients", icon: Users, mobile: true },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, mobile: true },
  { label: "Client Payments", href: "/payments", icon: CreditCard },
  { label: "POS", href: "/pos", icon: ShoppingCart, mobile: true },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
