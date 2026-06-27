import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/empty-state";
import type { ProductType } from "@/lib/products/types";
import { PosScreen } from "./pos-screen";

export type GridProduct = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  productType: ProductType;
  imageUrl: string | null;
  sellingPrice: number;
  containerSellingPrice: number | null;
  servingsPerContainer: number | null;
  currentStock: number;
};

export type GridCategory = { id: string; name: string };

// POS Sell screen data (Flow 8). Active products only (`deleted_at IS NULL`); category
// tabs are derived from the products present, so empty categories are hidden (US-6.16).
export async function SellView({ gymId }: { gymId: string }) {
  const products = await prisma.product.findMany({
    where: { gymId, deletedAt: null },
    orderBy: { name: "asc" },
    include: { category: { select: { id: true, name: true } } },
  });

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No products to sell"
        description="Add products under the Products tab first, then they appear here."
      />
    );
  }

  const grid: GridProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    productType: p.productType,
    imageUrl: p.imageUrl,
    sellingPrice: Number(p.sellingPrice),
    containerSellingPrice:
      p.containerSellingPrice === null ? null : Number(p.containerSellingPrice),
    servingsPerContainer: p.servingsPerContainer,
    currentStock: Number(p.currentStock),
  }));

  // One tab per category that has at least one active product (US-6.16).
  const seen = new Map<string, string>();
  for (const p of grid) seen.set(p.categoryId, p.categoryName);
  const categories: GridCategory[] = [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <PosScreen products={grid} categories={categories} />;
}
