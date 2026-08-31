import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

import { ProductRowActions } from "@/components/admin/product-row-actions";
import {
  AdminEmpty,
  PageHeader,
  Pagination,
  Panel,
  StatusPill,
  TableWrap,
  Td,
  Th,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { cn, formatDate } from "@/lib/utils";
import { listAdminProducts } from "@/server/admin/products";
import { getProductFormOptions } from "@/server/admin/products";

type Search = Promise<{
  q?: string;
  status?: string;
  categoryId?: string;
  stock?: string;
  page?: string;
}>;

const STOCK_FILTERS = [
  { value: "", label: "All stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

export default async function AdminProductsPage({ searchParams }: { searchParams: Search }) {
  const admin = await requireAdminPage("product.read");
  const params = await searchParams;

  const [{ products, total, page, pageCount }, { categories }] = await Promise.all([
    listAdminProducts({
      q: params.q,
      status: params.status,
      categoryId: params.categoryId,
      stock: params.stock === "low" || params.stock === "out" ? params.stock : undefined,
      page: Number.parseInt(params.page ?? "1", 10) || 1,
    }),
    getProductFormOptions(),
  ]);

  const writable = can(admin.role, "product.write");

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...overrides })) {
      if (value) next.set(key, value);
    }
    const query = next.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  }

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} ${total === 1 ? "piece" : "pieces"} in the catalogue, drafts included.`}
        actions={
          writable ? (
            <Button asChild size="sm">
              <Link href="/admin/products/new">
                <Plus className="size-4" />
                New product
              </Link>
            </Button>
          ) : null
        }
      />

      <Panel className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1">
            <span className="eyebrow block text-[0.5rem] text-faint">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Name, reference or brand"
              className="mt-1.5 w-full border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </label>

          <label>
            <span className="eyebrow block text-[0.5rem] text-faint">Status</span>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="mt-1.5 border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">Any status</option>
              {PRODUCT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="eyebrow block text-[0.5rem] text-faint">Category</span>
            <select
              name="categoryId"
              defaultValue={params.categoryId ?? ""}
              className="mt-1.5 border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="eyebrow block text-[0.5rem] text-faint">Stock</span>
            <select
              name="stock"
              defaultValue={params.stock ?? ""}
              className="mt-1.5 border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              {STOCK_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>

          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
          {params.q || params.status || params.categoryId || params.stock ? (
            <Link href="/admin/products" className="pb-2 text-xs text-muted hover:text-ink">
              Clear
            </Link>
          ) : null}
        </form>
      </Panel>

      {products.length === 0 ? (
        <AdminEmpty
          title="No products match"
          description="Adjust the filters, or add the first piece in this category."
          action={
            writable ? (
              <Button asChild size="sm">
                <Link href="/admin/products/new">New product</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <Panel>
          <TableWrap>
            <thead>
              <tr>
                <Th className="w-14" />
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const image = product.images[0];
                const lowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

                return (
                  <tr key={product.id}>
                    <Td>
                      <div className="relative aspect-4/5 w-10 overflow-hidden bg-shell">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            sizes="40px"
                            quality={75}
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-ink hover:underline"
                      >
                        {product.name}
                      </Link>
                      <span className="mt-0.5 block text-xs text-faint" data-numeric>
                        {product.brand} · {product.sku}
                      </span>
                    </Td>
                    <Td className="text-xs">{product.category.name}</Td>
                    <Td className="text-right" data-numeric>
                      {formatMoney(product.price, product.currency)}
                    </Td>
                    <Td className="text-right">
                      <span
                        className={cn(
                          "text-sm",
                          product.stock === 0 ? "text-danger" : lowStock ? "text-warning" : "text-ink-soft",
                        )}
                        data-numeric
                      >
                        {product.comingSoon ? "—" : product.stock}
                      </span>
                    </Td>
                    <Td>
                      <StatusPill
                        tone={
                          product.status === "ACTIVE"
                            ? "positive"
                            : product.status === "DRAFT"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {product.status.toLowerCase()}
                      </StatusPill>
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{formatDate(product.updatedAt)}</Td>
                    <Td>
                      {writable ? (
                        <ProductRowActions
                          product={{
                            id: product.id,
                            name: product.name,
                            slug: product.slug,
                            status: product.status,
                            hasOrders: product._count.orderItems > 0,
                          }}
                          canDelete={can(admin.role, "product.delete")}
                        />
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>

          <Pagination
            page={page}
            pageCount={pageCount}
            hrefFor={(target) => hrefWith({ page: String(target) })}
          />
        </Panel>
      )}
    </>
  );
}
