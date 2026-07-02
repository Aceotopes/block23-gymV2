import { UserMenu } from "./user-menu";
import { TopbarClock } from "./topbar-clock";
import { TopbarSearch } from "./command-menu";

// Topbar (DESIGN-SYSTEM §5.4 / Block 23 Console prototype): 58px sticky glass bar
// (z-20). Left = "23" wordmark tile + brand mark; center = search affordance;
// right = live gym-local clock + owner chip. Never holds page-specific actions
// (those live in the page header).
export function Topbar({
  name,
  email,
  role,
  timezone,
}: {
  name: string;
  email: string;
  role: string;
  timezone: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-border bg-[color-mix(in_srgb,var(--b23-bg)_86%,transparent)] px-4 backdrop-blur-[12px] md:px-[22px]">
      {/* Brand wordmark — fixed CSS mark (DESIGN-SYSTEM: no logo file). */}
      <div className="flex items-center gap-3">
        <div className="flex size-[30px] items-center justify-center rounded-[9px] bg-[image:var(--b23-grad-logo)] font-display text-sm font-bold text-[var(--b23-primary-on)] shadow-[var(--b23-glow-logo)]">
          23
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-base font-semibold tracking-[-0.01em] text-foreground">
            Block&nbsp;23
          </span>
          <span className="mt-[3px] font-mono text-[9px] font-medium tracking-[0.22em] text-[var(--b23-faint)]">
            GYM&nbsp;·&nbsp;OPERATIONS
          </span>
        </div>
      </div>

      {/* Search + ⌘K command palette. */}
      <TopbarSearch />

      {/* Right cluster: live clock + owner chip. */}
      <div className="flex items-center gap-4">
        <TopbarClock timezone={timezone} />
        <div className="hidden h-[26px] w-px bg-border sm:block" />
        <UserMenu name={name} email={email} role={role} />
      </div>
    </header>
  );
}
