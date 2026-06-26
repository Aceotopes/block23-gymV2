import { Button } from "@/components/ui/button";

// Placeholder home (Server Component). Replaced by the real shell + auth in the
// next Milestone-1 steps. Exists to validate design tokens, fonts, and shadcn.
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-card-foreground">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Block23 Gym
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Management System</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Project scaffold ready — Milestone 1. Owner auth and Settings come
          next.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
        </div>
        <p className="mt-6 font-mono text-sm tabular-nums text-muted-foreground">
          ₱12,450.00
        </p>
      </div>
    </main>
  );
}
