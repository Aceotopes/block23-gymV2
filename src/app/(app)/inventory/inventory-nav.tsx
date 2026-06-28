import Link from "next/link";

// Inventory module internal views (IA §6, ADR-023/047): Current Stock (default) +
// Movement History. Restock + Adjust are row actions on the stock view, not tabs.
// Active view lives in the URL `?view=` (ADR-047).
const VIEWS = [
  { key: "stock", label: "Current Stock" },
  { key: "movements", label: "Movement History" },
] as const;

export type InventoryViewKey = (typeof VIEWS)[number]["key"];

export function InventoryNav({ current }: { current: InventoryViewKey }) {
  return (
    <div className="mb-6 flex gap-1 border-b">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={`/inventory?view=${v.key}`}
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
