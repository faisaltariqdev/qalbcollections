"use server";

import { revalidatePath } from "next/cache";

import {
  attributeDefinitionSchema,
  taxonomySchema,
  type TaxonomyActionResult,
} from "@/lib/admin/taxonomy-schema";
import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categoryPath } from "@/lib/routes";
import { recordAudit } from "@/server/audit";

/**
 * Categories, collections and the attribute definitions that make the
 * catalogue category-agnostic.
 *
 * Switching a category from COMING_SOON to ACTIVE is the whole perfumes launch:
 * the storefront reads status, so nothing needs deploying.
 */

function fieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/** Optional text arrives as "" from a form; the column wants null. */
function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function saveCategory(
  input: unknown,
  categoryId?: string,
): Promise<TaxonomyActionResult> {
  try {
    const admin = await requirePermission("category.write");
    const parsed = taxonomySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
    }

    const value = parsed.data;
    const clash = await db.category.findFirst({
      where: { slug: value.slug, id: categoryId ? { not: categoryId } : undefined },
      select: { id: true },
    });
    if (clash) {
      return { ok: false, message: "That slug is taken.", fieldErrors: { slug: "Already in use" } };
    }

    // A category cannot be its own parent, and self-parenting would break the
    // nav tree rather than fail loudly.
    const parentId = value.parentId && value.parentId !== categoryId ? value.parentId : null;

    const data = {
      name: value.name,
      slug: value.slug,
      description: nullable(value.description),
      editorialIntro: nullable(value.editorialIntro),
      imageUrl: nullable(value.imageUrl),
      status: value.status,
      featured: value.featured,
      sortOrder: value.sortOrder,
      parentId,
      seoTitle: nullable(value.seoTitle),
      seoDescription: nullable(value.seoDescription),
      canonicalUrl: nullable(value.canonicalUrl),
      ogImageUrl: nullable(value.ogImageUrl),
      socialTitle: nullable(value.socialTitle),
      socialDescription: nullable(value.socialDescription),
      noIndex: value.noIndex,
    };

    const category = categoryId
      ? await db.category.update({ where: { id: categoryId }, data })
      : await db.category.create({ data });

    await recordAudit({
      actor: admin,
      action: categoryId ? "category.update" : "category.create",
      entity: "Category",
      entityId: category.id,
      summary: `${category.name} (${category.status})`,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(categoryPath(category.slug));

    return { ok: true, message: categoryId ? "Category saved." : "Category created.", id: category.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deleteCategory(categoryId: string): Promise<TaxonomyActionResult> {
  try {
    const admin = await requirePermission("category.write");
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, slug: true, _count: { select: { products: true, children: true } } },
    });
    if (!category) return { ok: false, message: "That category no longer exists." };

    // Products would be orphaned, so ask the operator to move them first
    // instead of cascading a delete through the catalogue.
    if (category._count.products > 0) {
      return {
        ok: false,
        message: `${category._count.products} product(s) still sit in this category. Move them first, or hide the category instead.`,
      };
    }
    if (category._count.children > 0) {
      return { ok: false, message: "Remove the sub-categories first." };
    }

    await db.category.delete({ where: { id: categoryId } });
    await recordAudit({
      actor: admin,
      action: "category.delete",
      entity: "Category",
      entityId: categoryId,
      summary: category.name,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    return { ok: true, message: "Category deleted." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function saveCollection(
  input: unknown,
  collectionId?: string,
): Promise<TaxonomyActionResult> {
  try {
    const admin = await requirePermission("collection.write");
    const parsed = taxonomySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
    }

    const value = parsed.data;
    const clash = await db.collection.findFirst({
      where: { slug: value.slug, id: collectionId ? { not: collectionId } : undefined },
      select: { id: true },
    });
    if (clash) {
      return { ok: false, message: "That slug is taken.", fieldErrors: { slug: "Already in use" } };
    }

    const data = {
      name: value.name,
      slug: value.slug,
      description: nullable(value.description),
      editorialIntro: nullable(value.editorialIntro),
      imageUrl: nullable(value.imageUrl),
      status: value.status,
      featured: value.featured,
      sortOrder: value.sortOrder,
      seoTitle: nullable(value.seoTitle),
      seoDescription: nullable(value.seoDescription),
      canonicalUrl: nullable(value.canonicalUrl),
      ogImageUrl: nullable(value.ogImageUrl),
      socialTitle: nullable(value.socialTitle),
      socialDescription: nullable(value.socialDescription),
      noIndex: value.noIndex,
    };

    const collection = collectionId
      ? await db.collection.update({ where: { id: collectionId }, data })
      : await db.collection.create({ data });

    await recordAudit({
      actor: admin,
      action: collectionId ? "collection.update" : "collection.create",
      entity: "Collection",
      entityId: collection.id,
      summary: collection.name,
    });

    revalidatePath("/admin/collections");
    revalidatePath("/collections");
    revalidatePath(`/collection/${collection.slug}`);

    return {
      ok: true,
      message: collectionId ? "Collection saved." : "Collection created.",
      id: collection.id,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deleteCollection(collectionId: string): Promise<TaxonomyActionResult> {
  try {
    const admin = await requirePermission("collection.write");
    const collection = await db.collection.findUnique({
      where: { id: collectionId },
      select: { name: true, slug: true },
    });
    if (!collection) return { ok: false, message: "That collection no longer exists." };

    // Only the membership rows go; the products themselves are untouched.
    await db.collection.delete({ where: { id: collectionId } });
    await recordAudit({
      actor: admin,
      action: "collection.delete",
      entity: "Collection",
      entityId: collectionId,
      summary: collection.name,
    });

    revalidatePath("/admin/collections");
    revalidatePath("/collections");
    return { ok: true, message: "Collection deleted." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function saveAttributeDefinition(input: unknown): Promise<TaxonomyActionResult> {
  try {
    const admin = await requirePermission("category.write");
    const parsed = attributeDefinitionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
    }

    const { id, categoryId, ...rest } = parsed.data;
    const data = { ...rest, unit: nullable(rest.unit), group: nullable(rest.group) };

    const definition = id
      ? await db.attributeDefinition.update({ where: { id }, data })
      : await db.attributeDefinition.create({ data: { ...data, categoryId } });

    await recordAudit({
      actor: admin,
      action: id ? "attribute.update" : "attribute.create",
      entity: "AttributeDefinition",
      entityId: definition.id,
      summary: `${definition.label} (${definition.key})`,
    });

    revalidatePath(`/admin/categories/${categoryId}`);
    return { ok: true, message: "Specification saved.", id: definition.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deleteAttributeDefinition(id: string): Promise<TaxonomyActionResult> {
  try {
    const admin = await requirePermission("category.write");
    const definition = await db.attributeDefinition.findUnique({
      where: { id },
      select: { label: true, categoryId: true, _count: { select: { values: true } } },
    });
    if (!definition) return { ok: false, message: "That specification no longer exists." };

    // Deleting cascades to every product's value for it, which is not something
    // to do by accident.
    if (definition._count.values > 0) {
      return {
        ok: false,
        message: `${definition._count.values} product(s) use this specification. Clear those values first.`,
      };
    }

    await db.attributeDefinition.delete({ where: { id } });
    await recordAudit({
      actor: admin,
      action: "attribute.delete",
      entity: "AttributeDefinition",
      entityId: id,
      summary: definition.label,
    });

    revalidatePath(`/admin/categories/${definition.categoryId}`);
    return { ok: true, message: "Specification removed." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
