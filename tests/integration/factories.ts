import { hashPassword } from "@/lib/auth/password";
import type { AdminRole } from "@/lib/constants";
import { db } from "@/lib/db";

/**
 * Fixtures for the integration suite. Only the columns a test cares about are
 * named; everything else takes the schema default, which is also what the
 * application relies on in production.
 */

export const PASSWORD = "Qalb!Test1234";

export async function createAdmin(role: AdminRole = "SUPER_ADMIN", overrides: { email?: string; active?: boolean } = {}) {
  return db.adminUser.create({
    data: {
      name: `${role} User`,
      email: overrides.email ?? `${role.toLowerCase()}@qalb.test`,
      passwordHash: await hashPassword(PASSWORD),
      role,
      active: overrides.active ?? true,
    },
  });
}

export async function createCustomer(overrides: { email?: string; active?: boolean } = {}) {
  return db.customer.create({
    data: {
      name: "Ayesha Khan",
      email: overrides.email ?? "shopper@qalb.test",
      phone: "+92 300 1234567",
      passwordHash: await hashPassword(PASSWORD),
      active: overrides.active ?? true,
    },
  });
}

export async function createCategory(overrides: { slug?: string; name?: string } = {}) {
  return db.category.create({
    data: {
      name: overrides.name ?? "Watches",
      slug: overrides.slug ?? "watches",
      status: "ACTIVE",
    },
  });
}

export interface ProductOptions {
  name?: string;
  slug?: string;
  sku?: string;
  brand?: string;
  price?: number;
  stock?: number;
  status?: string;
  comingSoon?: boolean;
  allowBackorder?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
}

export async function createProduct(categoryId: string, options: ProductOptions = {}) {
  const slug = options.slug ?? "test-piece";
  return db.product.create({
    data: {
      name: options.name ?? "Test Piece",
      slug,
      sku: options.sku ?? slug.toUpperCase(),
      brand: options.brand ?? "Cartier",
      categoryId,
      price: options.price ?? 2_450_000,
      stock: options.stock ?? 5,
      status: options.status ?? "ACTIVE",
      comingSoon: options.comingSoon ?? false,
      allowBackorder: options.allowBackorder ?? false,
      featured: options.featured ?? false,
      newArrival: options.newArrival ?? false,
      bestseller: options.bestseller ?? false,
      publishedAt: new Date(),
      images: {
        create: {
          url: `/uploads/${slug}.jpg`,
          alt: `${options.name ?? "Test Piece"} on a dark surface`,
          isPrimary: true,
        },
      },
    },
  });
}
