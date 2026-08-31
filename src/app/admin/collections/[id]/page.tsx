import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { PageHeader, Panel } from "@/components/admin/ui";
import { TaxonomyForm } from "@/components/admin/taxonomy-form";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { toTaxonomyValues } from "@/lib/admin/taxonomy-defaults";
import { db } from "@/lib/db";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage("collection.write");
  const { id } = await params;

  const collection = await db.collection.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        select: {
          product: { select: { id: true, name: true, brand: true, status: true } },
        },
      },
    },
  });

  if (!collection) notFound();

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Collections", href: "/admin/collections" }}
        title={collection.name}
        description={`${collection.products.length} product(s) in this collection`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/collection/${collection.slug}`} prefetch={false} target="_blank">
              View on site
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        }
      />

      {collection.products.length > 0 ? (
        <Panel
          className="mb-6"
          title="Members"
          description="Membership is set from each product's editor, under Placement."
        >
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {collection.products.map(({ product }) => (
              <li key={product.id} className="text-sm">
                <span className="eyebrow block text-[0.5rem] text-faint">{product.brand}</span>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="text-ink-soft hover:text-ink"
                >
                  {product.name}
                </Link>
                {product.status !== "ACTIVE" ? (
                  <span className="ml-2 text-xs text-faint">({product.status.toLowerCase()})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <TaxonomyForm
        kind="collection"
        recordId={collection.id}
        initial={toTaxonomyValues(collection)}
      />
    </>
  );
}
