import Link from "next/link";

// Client Payments internal views: Payment History (default) · Collections (US-5.4).
// The active view lives in the URL `?view=` param (ADR-047).
const VIEWS = [
  { key: "history", label: "Payment History" },
  { key: "collections", label: "Collections" },
] as const;

export type PaymentsViewKey = (typeof VIEWS)[number]["key"];

export function PaymentsNav({ current }: { current: PaymentsViewKey }) {
  return (
    <div className="mb-6 flex gap-1 border-b">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={`/payments?view=${v.key}`}
          aria-current={current === v.key ? "page" : undefined}
          className={
            current === v.key
              ? "border-primary text-foreground -mb-px border-b-2 px-4 py-2 text-sm font-medium"
              : "text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium"
          }
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
