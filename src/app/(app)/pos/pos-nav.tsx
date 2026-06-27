import Link from "next/link";

// POS module internal views (IA §5, ADR-023): Sell (the POS screen) · Products
// (catalog management) · History. Active view lives in the URL `?view=` (ADR-047).
const VIEWS = [
  { key: "sell", label: "Sell" },
  { key: "products", label: "Products" },
  { key: "history", label: "History" },
] as const;

export type PosViewKey = (typeof VIEWS)[number]["key"];

export function PosNav({ current }: { current: PosViewKey }) {
  return (
    <div className="mb-6 flex gap-1 border-b">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={`/pos?view=${v.key}`}
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
