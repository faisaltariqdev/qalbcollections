import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Admin catalogue read model.
 *
 * Distinct from `server/catalog.ts` on purpose: that one only ever returns
 * published products for shoppers, while this one must show drafts, archived
 * pieces and stock problems.
 */

const PER_PAGE = 20;

export interface AdminProductFilters {
  q?: string;
  status?: string;
  categoryId?: string;
  stock?: "low" | "out";
  page?: number;
}

export async function listAdminProducts(filters: AdminProductFilters) {
  const where: Prisma.ProductWhereInput = {};

  if (filters.q) {
    const term = filters.q.trim();
    where.OR = [
      { name: { contains: term } },
      { sku: { contains: term } },
      { brand: { contains: term } },
      { slug: { contains: term } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.stock === "out") where.stock = 0;
  if (filters.stock === "low") where.stock = { gt: 0, lte: 5 };

  const page = Math.max(1, filters.page ?? 1);

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        brand: true,
        price: true,
        currency: true,
        stock: true,
        lowStockThreshold: true,
        status: true,
        featured: true,
        comingSoon: true,
        updatedAt: true,
        category: { select: { name: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, alt: true },
        },
        _count: { select: { orderItems: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.product.count({ where }),
  ]);

  return {
    products: rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PER_PAGE)),
  };
}

/** Everything the product form needs to render, in one round trip. */
export async function getAdminProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      attributes: { include: { definition: true } },
      collections: { select: { collectionId: true } },
      tags: { select: { tagId: true } },
      faqs: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getProductFormOptions() {
  const [categories, collections, tags] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        attributes: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            key: true,
            label: true,
            unit: true,
            type: true,
            group: true,
          },
        },
      },
    }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
      select: { id: true, label: true, kind: true },
    }),
  ]);

  return { categories, collections, tags };
}

export async function listMediaAssets(folder?: string) {
  return db.mediaAsset.findMany({
    where: folder ? { folder } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
