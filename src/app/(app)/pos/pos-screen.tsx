"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  cartTotal,
  lineSubtotal,
  type CartMode,
} from "@/lib/pos/cart";
import { useCartStore } from "./pos-cart-store";
import { CheckoutDialog } from "./checkout-dialog";
import type { GridProduct, GridCategory } from "./sell-view";

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function stockText(p: GridProduct): string {
  const unit = p.productType === "SERVING_BASED_PRODUCT" ? "serving" : "unit";
  return `${p.currentStock.toLocaleString("en-PH")} ${unit}${
    p.currentStock === 1 ? "" : "s"
  }`;
}

export function PosScreen({
  products,
  categories,
}: {
  products: GridProduct[];
  categories: GridCategory[];
}) {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (tab !== "all" && p.categoryId !== tab) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, tab, search]);

  const total = cartTotal(lines);

  function addProduct(p: GridProduct, mode: CartMode) {
    add({
      productId: p.id,
      name: p.name,
      mode,
      unitPrice:
        mode === "container" ? (p.containerSellingPrice ?? 0) : p.sellingPrice,
      servingsPerContainer: p.servingsPerContainer,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      {/* Grid + filters */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            autoComplete="off"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={tab === "all" ? "default" : "outline"}
            onClick={() => setTab("all")}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={tab === c.id ? "default" : "outline"}
              onClick={() => setTab(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">No products match.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={addProduct} />
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <Card className="h-fit lg:sticky lg:top-4">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 font-medium">
            <ShoppingCart className="size-4" aria-hidden />
            Cart
            {lines.length > 0 ? (
              <Badge variant="secondary" className="ml-auto">
                {lines.length} line{lines.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>

          {lines.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Tap a product to add it to the cart.
            </p>
          ) : (
            <div className="space-y-2">
              {lines.map((l) => (
                <div
                  key={`${l.productId}:${l.mode}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {peso(l.unitPrice)}
                      {l.mode === "container"
                        ? " / container"
                        : l.mode === "serving"
                          ? " / serving"
                          : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(l.productId, l.mode, l.quantity - 1)}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <span className="w-6 text-center tabular-nums">{l.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(l.productId, l.mode, l.quantity + 1)}
                    >
                      <Plus aria-hidden />
                    </Button>
                  </div>
                  <span className="w-16 text-right font-mono tabular-nums">
                    {peso(lineSubtotal(l))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${l.name}`}
                    onClick={() => remove(l.productId, l.mode)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3 font-medium">
            <span>Total</span>
            <span className="font-mono text-lg tabular-nums">{peso(total)}</span>
          </div>

          <Button
            className="w-full"
            disabled={lines.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            Checkout
          </Button>
        </CardContent>
      </Card>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        lines={lines}
        total={total}
      />
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: GridProduct;
  onAdd: (p: GridProduct, mode: CartMode) => void;
}) {
  const servingBased = product.productType === "SERVING_BASED_PRODUCT";
  const hasContainer = servingBased && product.containerSellingPrice !== null;
  const low = product.currentStock <= 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-2 p-3">
        {product.imageUrl ? (
          // Arbitrary remote URLs — next/image can't host-validate these (plain img).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="bg-muted aspect-square w-full rounded object-cover"
          />
        ) : (
          <div className="bg-muted aspect-square w-full rounded" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={product.name}>
            {product.name}
          </p>
          <p
            className={
              low
                ? "text-warning-on text-xs tabular-nums"
                : "text-muted-foreground text-xs tabular-nums"
            }
          >
            {stockText(product)}
          </p>
        </div>

        {hasContainer ? (
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" variant="outline" onClick={() => onAdd(product, "serving")}>
              {peso(product.sellingPrice)}
              <span className="text-muted-foreground ml-1 text-xs">/serv</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAdd(product, "container")}>
              {peso(product.containerSellingPrice ?? 0)}
              <span className="text-muted-foreground ml-1 text-xs">/cont</span>
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onAdd(product, servingBased ? "serving" : "standard")}
          >
            <Plus aria-hidden />
            {peso(product.sellingPrice)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
