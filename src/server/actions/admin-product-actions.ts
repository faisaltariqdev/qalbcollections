"use server";

import { revalidatePath } from "next/cache";

import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { productSchema, type ProductActionResult } from "@/lib/admin/product-schema";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { categoryPath } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import { recordAudit } from "@/server/audit";

/**
 * Product writes.
 *
 * Every action re-checks the caller's permission server-side, validates with the
 * same schema the form uses, and records what changed. Nothing here trusts the
 * client — including whether the caller was allowed to see the button.
 */

function fieldErrorsFrom(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.filter((part) => typeof part === "string").join(".") || "form";
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/** Refreshes the storefront surfaces a product edit can appear on. */
function revalidateProduct(slug: string, categorySlug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/watches");
  revalidatePath("/new-arrivals");
  revalidatePath("/best-sellers");
  revalidatePath(`/product/${slug}`);
  if (categorySlug) revalidatePath(categoryPath(categorySlug));
  revalidatePath("/admin/products");
}

export async function saveProduct(
  input: unknown,
  productId?: string,
): Promise<ProductActionResult> {
  try {
    const admin = await requirePermission("product.write");
    const parsed = productSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        message: "Please fix the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error.issues),
      };
    }

    const data = parsed.data;

    const [slugClash, skuClash, category] = await Promise.all([
      db.product.findFirst({ where: { slug: data.slug, NOT: { id: productId } }, select: { id: true } }),
      db.product.findFirst({ where: { sku: data.sku, NOT: { id: productId } }, select: { id: true } }),
      db.category.findUnique({ where: { id: data.categoryId }, select: { id: true, slug: true } }),
    ]);

    if (slugClash) {
      return { ok: false, message: "That URL is taken.", fieldErrors: { slug: "Already in use" } };
    }
    if (skuClash) {
      return { ok: false, message: "That reference is taken.", fieldErrors: { sku: "Already in use" } };
    }
    if (!category) {
      return { ok: false, message: "That category no longer exists.", fieldErrors: { categoryId: "Unknown category" } };
    }

    const scalars = {
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      brand: data.brand,
      categoryId: data.categoryId,
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      story: data.story || null,
      price: toMinorUnits(data.price, data.currency),
      compareAtPrice: data.compareAtPrice ? toMinorUnits(data.compareAtPrice, data.currency) : null,
      currency: data.currency,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold,
      allowBackorder: data.allowBackorder,
      status: data.status,
      featured: data.featured,
      newArrival: data.newArrival,
      bestseller: data.bestseller,
      comingSoon: data.comingSoon,
      limited: data.limited,
      exclusive: data.exclusive,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      canonicalUrl: data.canonicalUrl || null,
      ogImageUrl: data.ogImageUrl || null,
      socialTitle: data.socialTitle || null,
      socialDescription: data.socialDescription || null,
      noIndex: data.noIndex,
      // Stamped the first time a piece goes live, and kept thereafter.
      publishedAt: data.status === "ACTIVE" ? new Date() : null,
    };

    const attributeValues = data.attributes.filter((attribute) => attribute.value.trim() !== "");

    const product = await db.$transaction(async (tx) => {
      const existing = productId
        ? await tx.product.findUnique({ where: { id: productId }, select: { publishedAt: true } })
        : null;

      const row = productId
        ? await tx.product.update({
            where: { id: productId },
            data: { ...scalars, publishedAt: existing?.publishedAt ?? scalars.publishedAt },
          })
        : await tx.product.create({ data: scalars });

      // Child rows are replaced wholesale: ordering matters and the form always
      // submits the complete intended set.
      await tx.productImage.deleteMany({ where: { productId: row.id } });
      if (data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((image, index) => ({
            productId: row.id,
            url: image.url,
            alt: image.alt,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        });
      }

      await tx.productAttribute.deleteMany({ where: { productId: row.id } });
      for (const attribute of attributeValues) {
        const numeric = Number.parseFloat(attribute.value.replace(/[^0-9.-]/g, ""));
        await tx.productAttribute.create({
          data: {
            productId: row.id,
            definitionId: attribute.definitionId,
            value: attribute.value.trim(),
            valueNumber: Number.isFinite(numeric) ? numeric : null,
          },
        });
      }

      await tx.productCollection.deleteMany({ where: { productId: row.id } });
      if (data.collectionIds.length > 0) {
        await tx.productCollection.createMany({
          data: data.collectionIds.map((collectionId, index) => ({
            productId: row.id,
            collectionId,
            sortOrder: index,
          })),
        });
      }

      await tx.productTag.deleteMany({ where: { productId: row.id } });
      if (data.tagIds.length > 0) {
        await tx.productTag.createMany({
          data: data.tagIds.map((tagId) => ({ productId: row.id, tagId })),
        });
      }

      await tx.faq.deleteMany({ where: { productId: row.id } });
      if (data.faqs.length > 0) {
        await tx.faq.createMany({
          data: data.faqs.map((faq, index) => ({
            productId: row.id,
            question: faq.question,
            answer: faq.answer,
            sortOrder: index,
          })),
        });
      }

      return row;
    });

    await recordAudit({
      actor: admin,
      action: productId ? "product.update" : "product.create",
      entity: "Product",
      entityId: product.id,
      summary: `${product.name} (${product.status})`,
    });

    revalidateProduct(product.slug, category.slug);

    return {
      ok: true,
      id: product.id,
      message: productId ? "Product saved." : "Product created.",
    };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function setProductStatus(
  productId: string,
  status: "DRAFT" | "ACTIVE" | "ARCHIVED",
): Promise<ProductActionResult> {
  try {
    const admin = await requirePermission("product.write");

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true, images: { select: { id: true }, take: 1 } },
    });
    if (!product) return { ok: false, message: "That product no longer exists." };

    if (status === "ACTIVE" && product.images.length === 0) {
      return { ok: false, message: "Add an image before publishing." };
    }

    await db.product.update({
      where: { id: productId },
      data: { status, publishedAt: status === "ACTIVE" ? new Date() : undefined },
    });

    await recordAudit({
      actor: admin,
      action: "product.status",
      entity: "Product",
      entityId: productId,
      summary: `${product.name} → ${status}`,
    });

    revalidateProduct(product.slug);
    return { ok: true, message: status === "ACTIVE" ? "Published." : "Updated." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

/** Copies a piece as a draft, so a near-identical reference is quick to add. */
export async function duplicateProduct(productId: string): Promise<ProductActionResult> {
  try {
    const admin = await requirePermission("product.write");

    const source = await db.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        attributes: true,
        collections: true,
        tags: true,
        faqs: true,
      },
    });
    if (!source) return { ok: false, message: "That product no longer exists." };

    const suffix = Date.now().toString(36).slice(-4).toUpperCase();
    const name = `${source.name} (copy)`;

    const copy = await db.$transaction(async (tx) => {
      const row = await tx.product.create({
        data: {
          name,
          slug: `${slugify(source.slug)}-copy-${suffix.toLowerCase()}`,
          sku: `${source.sku}-${suffix}`,
          brand: source.brand,
          categoryId: source.categoryId,
          shortDescription: source.shortDescription,
          description: source.description,
          story: source.story,
          price: source.price,
          compareAtPrice: source.compareAtPrice,
          currency: source.currency,
          stock: 0,
          lowStockThreshold: source.lowStockThreshold,
          allowBackorder: source.allowBackorder,
          // Never inherits published state: a copy is always a draft.
          status: "DRAFT",
          featured: false,
          newArrival: source.newArrival,
          bestseller: false,
          comingSoon: source.comingSoon,
          limited: source.limited,
          exclusive: source.exclusive,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
        },
      });

      if (source.images.length > 0) {
        await tx.productImage.createMany({
          data: source.images.map((image, index) => ({
            productId: row.id,
            url: image.url,
            alt: image.alt,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        });
      }
      for (const attribute of source.attributes) {
        await tx.productAttribute.create({
          data: {
            productId: row.id,
            definitionId: attribute.definitionId,
            value: attribute.value,
            valueNumber: attribute.valueNumber,
          },
        });
      }
      if (source.collections.length > 0) {
        await tx.productCollection.createMany({
          data: source.collections.map((link) => ({
            productId: row.id,
            collectionId: link.collectionId,
            sortOrder: link.sortOrder,
          })),
        });
      }
      if (source.tags.length > 0) {
        await tx.productTag.createMany({
          data: source.tags.map((link) => ({ productId: row.id, tagId: link.tagId })),
        });
      }
      if (source.faqs.length > 0) {
        await tx.faq.createMany({
          data: source.faqs.map((faq) => ({
            productId: row.id,
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
          })),
        });
      }

      return row;
    });

    await recordAudit({
      actor: admin,
      action: "product.duplicate",
      entity: "Product",
      entityId: copy.id,
      summary: `Copied from ${source.name}`,
    });

    revalidatePath("/admin/products");
    return { ok: true, id: copy.id, message: "Draft copy created." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

/**
 * Archives, or deletes outright when the piece has never been ordered. Anything
 * with order history is kept so past orders keep their link.
 */
export async function deleteProduct(productId: string): Promise<ProductActionResult> {
  try {
    const admin = await requirePermission("product.delete");

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true, _count: { select: { orderItems: true } } },
    });
    if (!product) return { ok: false, message: "That product no longer exists." };

    if (product._count.orderItems > 0) {
      await db.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } });
      await recordAudit({
        actor: admin,
        action: "product.archive",
        entity: "Product",
        entityId: productId,
        summary: `${product.name} archived (has order history)`,
      });
      revalidateProduct(product.slug);
      return { ok: true, message: "Archived — it appears in past orders, so it was kept." };
    }

    await db.product.delete({ where: { id: productId } });
    await recordAudit({
      actor: admin,
      action: "product.delete",
      entity: "Product",
      entityId: productId,
      summary: `${product.name} deleted`,
    });

    revalidateProduct(product.slug);
    return { ok: true, message: "Product deleted." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
