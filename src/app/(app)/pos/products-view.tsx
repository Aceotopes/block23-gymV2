import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { grossMargin } from "@/lib/products/margin";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/products/types";
import type { ProductFormValues } from "./product-schema";
import type { ProductsQuery } from "./products-search-params";
import { ProductsToolbar } from "./products-toolbar";
import { NewProductButton } from "./new-product-button";
import { CategoryManager } from "./category-manager";
import { ProductRowActions } from "./product-row-actions";

export type CategoryOption = { id: string; name: string };

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function stockLabel(productType: ProductType, currentStock: number): string {
  const n = currentStock.toLocaleString("en-PH");
  return productType === "SERVING_BASED_PRODUCT"
    ? `${n} serving${currentStock === 1 ? "" : "s"}`
    : `${n} unit${currentStock === 1 ? "" : "s"}`;
}

// Product Management (US-6.1–6.5, Flow 20). Server-rendered catalog list, URL-driven
// search + show-archived (ADR-047). Create/edit via the dialog; archive/restore via
// the row menu. Categories managed inline. `current_stock` is ledger-driven (ADR-004)
// and starts at 0 — restocks land in M7.
export async function ProductsView({
  gymId,
  query,
}: {
  gymId: string;
  query: ProductsQuery;
}) {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        gymId,
        ...(query.showArchived ? {} : { deletedAt: null }),
        ...(query.q
          ? { name: { contains: query.q, mode: "insensitive" } }
          : {}),
      },
      orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    }),
    prisma.productCategory.findMany({
      where: { gymId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const categoryOptions: CategoryOption[] = categories;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ProductsToolbar query={query} />
        <div className="flex items-center gap-2">
          <CategoryManager categories={categoryOptions} />
          <NewProductButton categories={categoryOptions} />
        </div>
      </div>

      {categoryOptions.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Add a category first"
          description="Products belong to a category (e.g. Beverages, Supplements). Use “Manage categories” to add one, then create products."
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={query.q ? "No products match" : "No products yet"}
          description={
            query.q
              ? "Adjust the search or the show-archived toggle."
              : "Use “New product” to add your first catalog item."
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-10 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const sellingPrice = Number(p.sellingPrice);
                const costPrice = p.costPrice === null ? null : Number(p.costPrice);
                const margin = grossMargin(sellingPrice, costPrice);
                const archived = p.deletedAt !== null;
                const initialValues: ProductFormValues = {
                  name: p.name,
                  categoryId: p.categoryId,
                  productType: p.productType,
                  sellingPrice,
                  costPrice,
                  imageUrl: p.imageUrl,
                  servingsPerContainer: p.servingsPerContainer,
                  containerSellingPrice:
                    p.containerSellingPrice === null
                      ? null
                      : Number(p.containerSellingPrice),
                  lowStockThreshold: Number(p.lowStockThreshold),
                  reorderPoint: p.reorderPoint,
                };
                return (
                  <TableRow key={p.id} className={archived ? "text-muted-foreground" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {archived ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Archived
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{p.category.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {PRODUCT_TYPE_LABELS[p.productType]}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {peso(sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {margin
                        ? `${peso(margin.amount)}${
                            margin.percent !== null
                              ? ` (${margin.percent.toFixed(0)}%)`
                              : ""
                          }`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {stockLabel(p.productType, Number(p.currentStock))}
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductRowActions
                        productId={p.id}
                        name={p.name}
                        archived={archived}
                        categories={categoryOptions}
                        initialValues={initialValues}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
