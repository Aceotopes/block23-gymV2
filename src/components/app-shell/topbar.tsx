import { UserMenu } from "./user-menu";

// Topbar (DESIGN-SYSTEM §5.4): 56px, sticky (z-20). Gym wordmark left, user menu
// right. Never holds page-specific actions (those live in the page header).
export function Topbar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold">Block23 Gym</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Management System
        </span>
      </div>
      <UserMenu name={name} email={email} role={role} />
    </header>
  );
}
