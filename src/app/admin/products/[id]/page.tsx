import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { toMajorUnits } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { getAdminProduct, getProductFormOptions } from "@/server/admin/products";
import { listAuditFor } from "@/server/audit";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("product.write");

  const { id } = await params;
  const [product, options] = await Promise.all([getAdminProduct(id), getProductFormOptions()]);
  if (!product) notFound();

  const history = await listAuditFor("Product", product.id, 5);

  const initial: ProductFormValues = {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    story: product.story ?? "",
    price: String(toMajorUnits(product.price, product.currency)),
    compareAtPrice: product.compareAtPrice
      ? String(toMajorUnits(product.compareAtPrice, product.currency))
      : "",
    currency: product.currency,
    stock: String(product.stock),
    lowStockThreshold: String(product.lowStockThreshold),
    allowBackorder: product.allowBackorder,
    status: product.status as ProductFormValues["status"],
    featured: product.featured,
    newArrival: product.newArrival,
    bestseller: product.bestseller,
    comingSoon: product.comingSoon,
    limited: product.limited,
    exclusive: product.exclusive,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    canonicalUrl: product.canonicalUrl ?? "",
    ogImageUrl: product.ogImageUrl ?? "",
    socialTitle: product.socialTitle ?? "",
    socialDescription: product.socialDescription ?? "",
    noIndex: product.noIndex,
    images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
    attributes: product.attributes.map((attribute) => ({
      definitionId: attribute.definitionId,
      value: attribute.value,
    })),
    collectionIds: product.collections.map((link) => link.collectionId),
    tagIds: product.tags.map((link) => link.tagId),
    faqs: product.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
  };

  return (
    <>
      <PageHeader
        title={product.name}
        description={`Last updated ${formatDate(product.updatedAt)}.`}
        breadcrumb={{ href: "/admin/products", label: "Products" }}
        actions={
          <div className="flex items-center gap-3">
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
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
            >
              View on site
              <ExternalLink className="size-3" />
            </Link>
          </div>
        }
      />

      <ProductForm productId={product.id} initial={initial} options={options} />

      {history.length > 0 ? (
        <div className="mb-24 mt-2">
          <p className="eyebrow text-[0.5rem] text-faint">Recent changes</p>
          <ul className="mt-3 space-y-1.5">
            {history.map((entry) => (
              <li key={entry.id} className="text-xs text-muted">
                {formatDate(entry.createdAt)} · {entry.action} ·{" "}
                {entry.actorEmail ?? "system"}
                {entry.summary ? ` · ${entry.summary}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
