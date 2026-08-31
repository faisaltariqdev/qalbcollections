import { describe, expect, it } from "vitest";

import {
  activeFilterChips,
  clearFiltersHref,
  countActiveFilters,
  hasActiveFilters,
  parseProductQuery,
  setPageHref,
  setPriceHref,
  setSortHref,
  toggleFacetHref,
} from "@/lib/product-query";

/**
 * The URL is the listing's state, so these helpers decide what a shared link
 * shows. They are pure, and every behaviour a shopper can trigger is covered.
 */

describe("parseProductQuery", () => {
  it("defaults to a featured, unfiltered first page", () => {
    const query = parseProductQuery({});
    expect(query.sort).toBe("featured");
    expect(query.page).toBe(1);
    expect(query.brands).toEqual([]);
    expect(query.inStockOnly).toBe(false);
    expect(query.attributes).toEqual({});
  });

  it("accepts repeated and comma-separated values for the same facet", () => {
    expect(parseProductQuery({ brand: ["Cartier", "Citizen"] }).brands).toEqual([
      "Cartier",
      "Citizen",
    ]);
    expect(parseProductQuery({ brand: "Cartier,Citizen" }).brands).toEqual(["Cartier", "Citizen"]);
  });

  it("reads category-specific attributes from attr_ parameters", () => {
    const query = parseProductQuery({ attr_movement: "Automatic", attr_case_size: "40,41" });
    expect(query.attributes).toEqual({ movement: ["Automatic"], case_size: ["40", "41"] });
  });

  it("converts prices from the major units shown in the URL to minor units", () => {
    const query = parseProductQuery({ price_min: "10000", price_max: "25000" }, { currency: "PKR" });
    expect(query.priceMin).toBe(1_000_000);
    expect(query.priceMax).toBe(2_500_000);
  });

  it("ignores an unrecognised sort rather than passing it to the database", () => {
    expect(parseProductQuery({ sort: "cheapest-ever" }).sort).toBe("featured");
    expect(parseProductQuery({ sort: "price-asc" }).sort).toBe("price-asc");
  });

  it("ignores a nonsense page number", () => {
    expect(parseProductQuery({ page: "-4" }).page).toBe(1);
    expect(parseProductQuery({ page: "abc" }).page).toBe(1);
    expect(parseProductQuery({ page: "3" }).page).toBe(3);
  });

  it("treats a blank search term as no search", () => {
    expect(parseProductQuery({ q: "   " }).search).toBeUndefined();
    expect(parseProductQuery({ q: "  black watch " }).search).toBe("black watch");
  });

  it("carries through the caller's scope", () => {
    const query = parseProductQuery({}, { categorySlug: "watches", perPage: 16 });
    expect(query.categorySlug).toBe("watches");
    expect(query.perPage).toBe(16);
  });
});

describe("toggleFacetHref", () => {
  it("adds a value that is not selected", () => {
    expect(toggleFacetHref("/watches", {}, "brand", "Cartier")).toBe("/watches?brand=Cartier");
  });

  it("removes a value that is selected, leaving the others", () => {
    const href = toggleFacetHref("/watches", { brand: ["Cartier", "Citizen"] }, "brand", "Cartier");
    expect(href).toBe("/watches?brand=Citizen");
  });

  it("drops the query string entirely when the last filter is removed", () => {
    expect(toggleFacetHref("/watches", { brand: "Cartier" }, "brand", "Cartier")).toBe("/watches");
  });

  it("returns to page one, because page four of the old result set is meaningless", () => {
    const href = toggleFacetHref("/watches", { page: "4" }, "brand", "Cartier");
    expect(href).toBe("/watches?brand=Cartier");
  });

  it("leaves unrelated parameters alone", () => {
    const href = toggleFacetHref("/watches", { sort: "price-asc" }, "brand", "Cartier");
    expect(href).toContain("sort=price-asc");
    expect(href).toContain("brand=Cartier");
  });
});

describe("price, sort and page links", () => {
  it("writes prices back as major units", () => {
    expect(setPriceHref("/watches", {}, 1_000_000, 2_500_000, "PKR")).toBe(
      "/watches?price_min=10000&price_max=25000",
    );
  });

  it("clears the price filter when both bounds are null", () => {
    expect(setPriceHref("/watches", { price_min: "10000" }, null, null)).toBe("/watches");
  });

  it("omits the default sort from the URL so the clean path stays canonical", () => {
    expect(setSortHref("/watches", { sort: "price-asc" }, "featured")).toBe("/watches");
    expect(setSortHref("/watches", {}, "newest")).toBe("/watches?sort=newest");
  });

  it("omits page one, and keeps filters when paging", () => {
    expect(setPageHref("/watches", { brand: "Cartier", page: "3" }, 1)).toBe("/watches?brand=Cartier");
    expect(setPageHref("/watches", { brand: "Cartier" }, 2)).toBe("/watches?brand=Cartier&page=2");
  });
});

describe("clearFiltersHref", () => {
  it("removes filters but preserves sort", () => {
    const href = clearFiltersHref("/watches", {
      brand: "Cartier",
      attr_movement: "Automatic",
      price_min: "10000",
      sort: "price-asc",
    });
    expect(href).toBe("/watches?sort=price-asc");
  });
});

describe("filter counting", () => {
  it("reports whether anything is filtered", () => {
    expect(hasActiveFilters({ sort: "price-asc", page: "2" })).toBe(false);
    expect(hasActiveFilters({ brand: "Cartier" })).toBe(true);
  });

  it("counts a price range as a single filter, however many bounds it has", () => {
    expect(countActiveFilters({ price_min: "10000", price_max: "25000" })).toBe(1);
    expect(countActiveFilters({ brand: ["Cartier", "Citizen"], attr_movement: "Automatic" })).toBe(3);
  });
});

describe("activeFilterChips", () => {
  const format = (minor: number) => `Rs ${minor / 100}`;

  it("labels each chip and links to its own removal", () => {
    const chips = activeFilterChips(
      "/watches",
      { brand: "Cartier" },
      { brand: "Brand" },
      format,
      "PKR",
    );
    expect(chips).toHaveLength(1);
    expect(chips[0].label).toBe("Brand: Cartier");
    expect(chips[0].href).toBe("/watches");
  });

  it("describes an open-ended price range in words", () => {
    const [chip] = activeFilterChips("/watches", { price_min: "10000" }, {}, format, "PKR");
    expect(chip.label).toBe("From Rs 10000");
  });
});
