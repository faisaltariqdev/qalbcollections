import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { getFacets, getProductBySlug, listProducts } from "@/server/catalog";
import { getSearchSuggestions, searchProducts } from "@/server/search";

import { createCategory, createProduct } from "./factories";

/**
 * The catalogue read model against real SQL: what a shopper is allowed to see,
 * how facets count, and how category-declared attributes drive both filtering
 * and the specification table.
 */

let watches: string;
let movementId: string;
let caseSizeId: string;

async function attach(productId: string, definitionId: string, value: string) {
  const numeric = Number.parseFloat(value);
  await db.productAttribute.create({
    data: {
      productId,
      definitionId,
      value,
      valueNumber: Number.isFinite(numeric) ? numeric : null,
    },
  });
}

beforeEach(async () => {
  watches = (await createCategory()).id;

  const movement = await db.attributeDefinition.create({
    data: {
      categoryId: watches,
      key: "movement",
      label: "Movement",
      filterable: true,
      showInSpecs: true,
      sortOrder: 0,
    },
  });
  const caseSize = await db.attributeDefinition.create({
    data: {
      categoryId: watches,
      key: "case-size",
      label: "Case Size",
      unit: "mm",
      type: "NUMBER",
      filterable: true,
      showInSpecs: true,
      sortOrder: 1,
    },
  });
  movementId = movement.id;
  caseSizeId = caseSize.id;

  const tank = await createProduct(watches, {
    name: "Tank Must",
    slug: "tank-must",
    sku: "QC-A",
    brand: "Cartier",
    price: 4_250_000,
    stock: 2,
  });
  const carrera = await createProduct(watches, {
    name: "Carrera Twin-Time",
    slug: "carrera-twin-time",
    sku: "QC-B",
    brand: "TAG Heuer",
    price: 2_450_000,
    stock: 0,
  });
  const quartz = await createProduct(watches, {
    name: "Citizen Quartz",
    slug: "citizen-quartz",
    sku: "QC-C",
    brand: "Citizen",
    price: 950_000,
    stock: 6,
  });

  await attach(tank.id, movementId, "Quartz");
  await attach(carrera.id, movementId, "Automatic");
  await attach(quartz.id, movementId, "Quartz");
  await attach(tank.id, caseSizeId, "34");
  await attach(carrera.id, caseSizeId, "41");
  await attach(quartz.id, caseSizeId, "39");
});

describe("what is published", () => {
  it("lists only active pieces in a visible category", async () => {
    await createProduct(watches, { slug: "draft-piece", sku: "QC-D", status: "DRAFT" });
    const hidden = await createCategory({ slug: "hidden", name: "Hidden" });
    await db.category.update({ where: { id: hidden.id }, data: { status: "HIDDEN" } });
    await createProduct(hidden.id, { slug: "buried", sku: "QC-E" });

    const result = await listProducts({ perPage: 20 });

    expect(result.total).toBe(3);
    expect(result.products.map((product) => product.slug)).not.toContain("draft-piece");
    expect(result.products.map((product) => product.slug)).not.toContain("buried");
  });

  it("hides a draft from its own product page", async () => {
    await createProduct(watches, { slug: "not-yet", sku: "QC-F", status: "DRAFT" });
    await expect(getProductBySlug("not-yet")).resolves.toBeNull();
  });
});

describe("filtering", () => {
  it("filters by brand", async () => {
    const result = await listProducts({ brands: ["Cartier"], perPage: 20 });
    expect(result.products.map((product) => product.brand)).toEqual(["Cartier"]);
  });

  it("filters by price range, inclusive of the bounds", async () => {
    const result = await listProducts({ priceMin: 950_000, priceMax: 2_450_000, perPage: 20 });
    expect(result.total).toBe(2);
  });

  it("ORs values within one attribute and ANDs across attributes", async () => {
    const quartz = await listProducts({ attributes: { movement: ["Quartz"] }, perPage: 20 });
    expect(quartz.total).toBe(2);

    const either = await listProducts({
      attributes: { movement: ["Quartz", "Automatic"] },
      perPage: 20,
    });
    expect(either.total).toBe(3);

    const both = await listProducts({
      attributes: { movement: ["Quartz"], "case-size": ["34"] },
      perPage: 20,
    });
    expect(both.products.map((product) => product.slug)).toEqual(["tank-must"]);
  });

  it("hides sold-out pieces when availability is filtered", async () => {
    const result = await listProducts({ inStockOnly: true, perPage: 20 });
    expect(result.products.map((product) => product.slug)).not.toContain("carrera-twin-time");
    expect(result.total).toBe(2);
  });

  it("still lists a sold-out piece when availability is not filtered, but marks it", async () => {
    const result = await listProducts({ perPage: 20 });
    const carrera = result.products.find((product) => product.slug === "carrera-twin-time");
    expect(carrera?.inStock).toBe(false);
  });

  it("keeps a backordered piece available despite zero stock", async () => {
    await db.product.updateMany({
      where: { slug: "carrera-twin-time" },
      data: { allowBackorder: true },
    });

    const result = await listProducts({ inStockOnly: true, perPage: 20 });
    expect(result.products.map((product) => product.slug)).toContain("carrera-twin-time");
  });

  it("excludes coming-soon pieces when the caller asks for buyable stock only", async () => {
    await db.product.updateMany({ where: { slug: "tank-must" }, data: { comingSoon: true } });

    const withSoon = await listProducts({ perPage: 20 });
    const withoutSoon = await listProducts({ includeComingSoon: false, perPage: 20 });

    expect(withSoon.total).toBe(3);
    expect(withoutSoon.total).toBe(2);
  });

  it("matches a search term against name, brand and attribute values", async () => {
    await expect(listProducts({ search: "carrera", perPage: 20 })).resolves.toMatchObject({
      total: 1,
    });
    await expect(listProducts({ search: "Citizen", perPage: 20 })).resolves.toMatchObject({
      total: 1,
    });
    await expect(listProducts({ search: "Automatic", perPage: 20 })).resolves.toMatchObject({
      total: 1,
    });
  });
});

describe("sorting and paging", () => {
  it("sorts by price in both directions", async () => {
    const ascending = await listProducts({ sort: "price-asc", perPage: 20 });
    expect(ascending.products.map((product) => product.price)).toEqual([
      950_000,
      2_450_000,
      4_250_000,
    ]);

    const descending = await listProducts({ sort: "price-desc", perPage: 20 });
    expect(descending.products[0].price).toBe(4_250_000);
  });

  it("puts coming-soon pieces last in the curated order", async () => {
    await db.product.updateMany({ where: { slug: "tank-must" }, data: { comingSoon: true } });

    const result = await listProducts({ sort: "featured", perPage: 20 });
    expect(result.products.at(-1)?.slug).toBe("tank-must");
  });

  it("pages without dropping or repeating a piece", async () => {
    const first = await listProducts({ sort: "price-asc", perPage: 2, page: 1 });
    const second = await listProducts({ sort: "price-asc", perPage: 2, page: 2 });

    expect(first.pageCount).toBe(2);
    expect(first.products).toHaveLength(2);
    expect(second.products).toHaveLength(1);
    expect(first.products.map((p) => p.id)).not.toContain(second.products[0].id);
  });

  it("clamps a page number beyond the end to the last page", async () => {
    const result = await listProducts({ perPage: 2, page: 99 });
    expect(result.page).toBe(2);
  });
});

describe("facets", () => {
  it("counts each brand against the other filters, not itself", async () => {
    const facets = await getFacets({
      categorySlug: "watches",
      brands: ["Cartier"],
      attributes: {},
    });

    const brand = facets.find((facet) => facet.param === "brand");
    expect(brand?.options).toHaveLength(3);
    expect(brand?.options.find((option) => option.value === "Cartier")?.selected).toBe(true);
    expect(brand?.options.find((option) => option.value === "Citizen")?.count).toBe(1);
  });

  it("offers only the attributes the category declares as filterable", async () => {
    await db.attributeDefinition.create({
      data: { categoryId: watches, key: "crystal", label: "Crystal", filterable: false },
    });

    const facets = await getFacets({ categorySlug: "watches", attributes: {} });
    const params = facets.map((facet) => facet.param);

    expect(params).toContain("attr_movement");
    expect(params).toContain("attr_case-size");
    expect(params).not.toContain("attr_crystal");
  });

  it("keeps the other values of a facet visible once one is ticked", async () => {
    const facets = await getFacets({
      categorySlug: "watches",
      attributes: { movement: ["Quartz"] },
    });

    const movement = facets.find((facet) => facet.param === "attr_movement");
    expect(movement?.options.map((option) => option.value).sort()).toEqual(["Automatic", "Quartz"]);
    expect(movement?.options.find((option) => option.value === "Automatic")?.count).toBe(1);
  });

  it("orders numeric facet values numerically and labels them with the unit", async () => {
    const facets = await getFacets({ categorySlug: "watches", attributes: {} });
    const size = facets.find((facet) => facet.param === "attr_case-size");

    expect(size?.options.map((option) => option.value)).toEqual(["34", "39", "41"]);
    expect(size?.options[0].label).toBe("34 mm");
  });

  it("reports the price range of the current set", async () => {
    const facets = await getFacets({ categorySlug: "watches", attributes: {} });
    const price = facets.find((facet) => facet.param === "price");

    expect(price?.range).toMatchObject({ min: 950_000, max: 4_250_000 });
  });

  it("drops a facet that cannot discriminate", async () => {
    await db.product.deleteMany({ where: { slug: { in: ["carrera-twin-time", "citizen-quartz"] } } });

    const facets = await getFacets({ categorySlug: "watches", attributes: {} });

    expect(facets.map((facet) => facet.param)).not.toContain("brand");
    expect(facets.map((facet) => facet.param)).not.toContain("attr_movement");
  });
});

describe("product detail", () => {
  it("renders only declared, non-empty specifications, in the declared order", async () => {
    const product = await getProductBySlug("tank-must");

    expect(product?.specifications.map((row) => row.label)).toEqual(["Movement", "Case Size"]);
    expect(product?.specifications[1].value).toBe("34 mm");
  });

  it("leaves out a specification the category declares but the piece does not have", async () => {
    await db.attributeDefinition.create({
      data: { categoryId: watches, key: "power-reserve", label: "Power Reserve" },
    });

    const product = await getProductBySlug("tank-must");
    expect(product?.specifications.map((row) => row.key)).not.toContain("power-reserve");
  });

  it("shows only approved reviews", async () => {
    const row = await db.product.findFirstOrThrow({ where: { slug: "tank-must" } });
    await db.review.createMany({
      data: [
        { productId: row.id, authorName: "Approved", rating: 5, body: "Beautiful piece.", approved: true },
        { productId: row.id, authorName: "Pending", rating: 1, body: "Not moderated.", approved: false },
      ],
    });

    const product = await getProductBySlug("tank-must");
    expect(product?.reviews.map((review) => review.authorName)).toEqual(["Approved"]);
  });

  it("derives a low-stock badge from the threshold rather than free text", async () => {
    await db.product.updateMany({
      where: { slug: "citizen-quartz" },
      data: { stock: 1, lowStockThreshold: 2 },
    });

    const product = await getProductBySlug("citizen-quartz");
    expect(product?.badges.map((badge) => badge.label)).toContain("Low stock");
  });
});

describe("search", () => {
  it("finds a piece by brand and by reference", async () => {
    const byBrand = await searchProducts("tag heuer");
    expect(byBrand.map((hit) => hit.slug)).toContain("carrera-twin-time");

    const bySku = await searchProducts("QC-C");
    expect(bySku.map((hit) => hit.slug)).toContain("citizen-quartz");
  });

  it("ranks an exact brand match above an incidental mention", async () => {
    await createProduct(watches, {
      name: "Steel Bracelet Piece",
      slug: "steel-bracelet",
      sku: "QC-G",
      brand: "Citizen",
    });
    await db.product.updateMany({
      where: { slug: "tank-must" },
      data: { shortDescription: "An alternative to a Citizen." },
    });

    const hits = await searchProducts("citizen");
    expect(hits[0].brand).toBe("Citizen");
  });

  it("expands a shopper's word into catalogue vocabulary", async () => {
    // "auto" is not in any field; the synonym table maps it to "Automatic".
    const hits = await searchProducts("auto");
    expect(hits.map((hit) => hit.slug)).toContain("carrera-twin-time");
  });

  it("returns nothing, and no error, for a term that matches nothing", async () => {
    await expect(searchProducts("submarine sandwich")).resolves.toEqual([]);
  });

  it("suggests the closest brand when a name is mistyped", async () => {
    const suggestions = await getSearchSuggestions("cartiar");
    expect(suggestions.didYouMean).toBe("Cartier");
  });

  it("offers matching brands, categories and collections alongside products", async () => {
    await db.collection.create({
      data: { name: "The Quartz Edit", slug: "quartz-edit", status: "ACTIVE" },
    });

    const suggestions = await getSearchSuggestions("quartz");

    expect(suggestions.products.length).toBeGreaterThan(0);
    expect(suggestions.collections.map((collection) => collection.slug)).toContain("quartz-edit");
  });
});
