import { beforeEach, describe, expect, it } from "vitest";

import { signInAdmin } from "@/server/actions/admin-auth-actions";
import {
  deleteProduct,
  duplicateProduct,
  saveProduct,
  setProductStatus,
} from "@/server/actions/admin-product-actions";
import { db } from "@/lib/db";
import type { AdminRole } from "@/lib/constants";

import { createAdmin, createCategory, createProduct, PASSWORD } from "./factories";

/**
 * Product writes through the real Server Actions: validation, uniqueness,
 * money conversion, the permission matrix and the audit trail.
 */

let categoryId: string;

async function signedInAs(role: AdminRole) {
  const admin = await createAdmin(role);
  const result = await signInAdmin({ email: admin.email, password: PASSWORD });
  expect(result.ok).toBe(true);
  return admin;
}

function form(overrides: Record<string, unknown> = {}) {
  return {
    name: "Cartier Tank Must",
    slug: "cartier-tank-must",
    sku: "QC-CTM-001",
    brand: "Cartier",
    categoryId,
    shortDescription: "",
    description: "",
    story: "",
    price: "42500",
    compareAtPrice: "",
    currency: "PKR",
    stock: "3",
    lowStockThreshold: "1",
    allowBackorder: false,
    status: "DRAFT",
    featured: false,
    newArrival: false,
    bestseller: false,
    comingSoon: false,
    limited: false,
    exclusive: false,
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    ogImageUrl: "",
    socialTitle: "",
    socialDescription: "",
    noIndex: false,
    images: [{ url: "/uploads/tank.jpg", alt: "Cartier Tank Must on a navy tie" }],
    attributes: [],
    collectionIds: [],
    tagIds: [],
    faqs: [],
    ...overrides,
  };
}

beforeEach(async () => {
  categoryId = (await createCategory()).id;
});

describe("saveProduct", () => {
  it("creates a product and converts the price to minor units once", async () => {
    await signedInAs("ADMIN");

    const result = await saveProduct(form());

    expect(result.ok).toBe(true);
    const product = await db.product.findUniqueOrThrow({
      where: { id: result.id },
      include: { images: true },
    });
    expect(product.price).toBe(4_250_000);
    expect(product.sku).toBe("QC-CTM-001");
    expect(product.images).toHaveLength(1);
    expect(product.images[0].isPrimary).toBe(true);
  });

  it("records who created it", async () => {
    const admin = await signedInAs("ADMIN");
    const result = await saveProduct(form());

    const [log] = await db.auditLog.findMany({ where: { action: "product.create" } });
    expect(log?.entityId).toBe(result.id);
    expect(log?.adminUserId).toBe(admin.id);
  });

  it("returns field errors instead of writing a malformed product", async () => {
    await signedInAs("ADMIN");

    const result = await saveProduct(form({ name: "", price: "0" }));

    expect(result.ok).toBe(false);
    expect(result.fieldErrors).toMatchObject({ name: expect.any(String), price: expect.any(String) });
    expect(await db.product.count()).toBe(0);
  });

  it("refuses to publish a piece with no photography", async () => {
    await signedInAs("ADMIN");

    const result = await saveProduct(form({ status: "ACTIVE", images: [] }));

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.images).toBeTruthy();
  });

  it("refuses a slug already in use, so two pieces cannot share a URL", async () => {
    await signedInAs("ADMIN");
    await saveProduct(form());

    const clash = await saveProduct(form({ sku: "QC-CTM-002" }));

    expect(clash.ok).toBe(false);
    expect(clash.fieldErrors?.slug).toBeTruthy();
    expect(await db.product.count()).toBe(1);
  });

  it("refuses a reference already in use", async () => {
    await signedInAs("ADMIN");
    await saveProduct(form());

    const clash = await saveProduct(form({ slug: "cartier-tank-must-two" }));

    expect(clash.ok).toBe(false);
    expect(clash.fieldErrors?.sku).toBeTruthy();
  });

  it("refuses a category that no longer exists", async () => {
    await signedInAs("ADMIN");

    const result = await saveProduct(form({ categoryId: "does-not-exist" }));

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.categoryId).toBeTruthy();
  });

  it("replaces images on edit rather than accumulating them", async () => {
    await signedInAs("ADMIN");
    const created = await saveProduct(form());

    await saveProduct(
      form({
        images: [
          { url: "/uploads/tank-wrist.jpg", alt: "Cartier Tank Must worn on the wrist" },
          { url: "/uploads/tank-clasp.jpg", alt: "The clasp of the Cartier Tank Must" },
        ],
      }),
      created.id,
    );

    const images = await db.productImage.findMany({
      where: { productId: created.id },
      orderBy: { sortOrder: "asc" },
    });
    expect(images.map((image) => image.url)).toEqual([
      "/uploads/tank-wrist.jpg",
      "/uploads/tank-clasp.jpg",
    ]);
  });

  it("stores a numeric attribute value so range filters can use SQL", async () => {
    await signedInAs("ADMIN");
    const definition = await db.attributeDefinition.create({
      data: { categoryId, key: "case-size", label: "Case Size", type: "NUMBER", unit: "mm" },
    });

    const result = await saveProduct(
      form({ attributes: [{ definitionId: definition.id, value: "41 mm" }] }),
    );

    const attribute = await db.productAttribute.findFirstOrThrow({
      where: { productId: result.id },
    });
    expect(attribute.value).toBe("41 mm");
    expect(attribute.valueNumber).toBe(41);
  });

  it("keeps the original publish date when an already-live piece is edited", async () => {
    await signedInAs("ADMIN");
    const created = await saveProduct(form({ status: "ACTIVE" }));
    const first = await db.product.findUniqueOrThrow({ where: { id: created.id } });

    await saveProduct(form({ status: "ACTIVE", name: "Cartier Tank Must (2026)" }), created.id);
    const second = await db.product.findUniqueOrThrow({ where: { id: created.id } });

    expect(second.publishedAt?.toISOString()).toBe(first.publishedAt?.toISOString());
  });
});

describe("permissions", () => {
  it("stops an order manager writing to the catalogue", async () => {
    await signedInAs("ORDER_MANAGER");

    const result = await saveProduct(form());

    expect(result.ok).toBe(false);
    expect(result.message).toContain("permission");
    expect(await db.product.count()).toBe(0);
  });

  it("stops a signed-out visitor writing to the catalogue", async () => {
    const result = await saveProduct(form());

    expect(result.ok).toBe(false);
    expect(result.message).toContain("sign in");
    expect(await db.product.count()).toBe(0);
  });

  it("lets an editor create but not delete", async () => {
    await signedInAs("EDITOR");
    const created = await saveProduct(form());
    expect(created.ok).toBe(true);

    const deleted = await deleteProduct(created.id!);
    expect(deleted.ok).toBe(false);
    expect(await db.product.count()).toBe(1);
  });
});

describe("setProductStatus", () => {
  it("publishes a draft that has an image", async () => {
    await signedInAs("ADMIN");
    const product = await createProduct(categoryId, { status: "DRAFT", slug: "draft-piece" });

    const result = await setProductStatus(product.id, "ACTIVE");

    expect(result.ok).toBe(true);
    const updated = await db.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.status).toBe("ACTIVE");
    expect(updated.publishedAt).toBeInstanceOf(Date);
  });

  it("will not publish a piece with nothing to show", async () => {
    await signedInAs("ADMIN");
    const product = await createProduct(categoryId, { status: "DRAFT", slug: "bare-piece" });
    await db.productImage.deleteMany({ where: { productId: product.id } });

    const result = await setProductStatus(product.id, "ACTIVE");

    expect(result.ok).toBe(false);
    expect(result.message).toContain("image");
  });
});

describe("duplicateProduct", () => {
  it("copies a piece as an unpublished, out-of-stock draft", async () => {
    await signedInAs("ADMIN");
    const source = await createProduct(categoryId, {
      slug: "carrera-twin-time",
      sku: "QC-TH-001",
      featured: true,
      stock: 4,
    });

    const result = await duplicateProduct(source.id);

    expect(result.ok).toBe(true);
    const copy = await db.product.findUniqueOrThrow({
      where: { id: result.id },
      include: { images: true },
    });
    expect(copy.status).toBe("DRAFT");
    expect(copy.stock).toBe(0);
    expect(copy.featured).toBe(false);
    expect(copy.slug).not.toBe(source.slug);
    expect(copy.sku).not.toBe(source.sku);
    expect(copy.images).toHaveLength(1);
  });
});

describe("deleteProduct", () => {
  it("deletes a piece that was never ordered", async () => {
    await signedInAs("SUPER_ADMIN");
    const product = await createProduct(categoryId, { slug: "unsold-piece" });

    const result = await deleteProduct(product.id);

    expect(result.ok).toBe(true);
    expect(await db.product.count()).toBe(0);
  });

  it("archives rather than deletes a piece with order history, so past orders keep their link", async () => {
    await signedInAs("SUPER_ADMIN");
    const product = await createProduct(categoryId, { slug: "sold-piece" });
    await db.order.create({
      data: {
        orderNumber: "QC-2026-000001",
        customerName: "Ayesha Khan",
        customerEmail: "shopper@qalb.test",
        customerPhone: "+92 300 1234567",
        subtotal: product.price,
        total: product.price,
        shippingName: "Ayesha Khan",
        shippingLine1: "12 Zamzama Boulevard",
        shippingCity: "Karachi",
        items: {
          create: {
            productId: product.id,
            name: product.name,
            brand: product.brand,
            sku: product.sku,
            quantity: 1,
            unitPrice: product.price,
            lineTotal: product.price,
          },
        },
      },
    });

    const result = await deleteProduct(product.id);

    expect(result.ok).toBe(true);
    const kept = await db.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(kept.status).toBe("ARCHIVED");
  });
});
