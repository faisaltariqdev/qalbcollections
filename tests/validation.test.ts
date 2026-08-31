import { describe, expect, it } from "vitest";

import { productSchema, type ProductFormValues } from "@/lib/admin/product-schema";
import { checkoutSchema } from "@/lib/checkout";
import { contactSchema } from "@/lib/contact";
import { availablePaymentProviders, getPaymentProvider } from "@/lib/payments";

/**
 * Validation is the gate between an operator's typing and the storefront, and
 * between a shopper's typing and an order. Both are asserted here.
 */

const valid: ProductFormValues = {
  name: "Cartier Tank Must",
  slug: "cartier-tank-must",
  sku: "QC-CTM-001",
  brand: "Cartier",
  categoryId: "cat_watches",
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
  images: [],
  attributes: [],
  collectionIds: [],
  tagIds: [],
  faqs: [],
};

function parse(overrides: Partial<ProductFormValues> = {}) {
  return productSchema.safeParse({ ...valid, ...overrides });
}

function errorFor(result: ReturnType<typeof parse>, field: string) {
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path.join(".") === field)?.message;
}

describe("productSchema", () => {
  it("accepts a well-formed draft", () => {
    const result = parse();
    expect(result.success).toBe(true);
  });

  it("normalises the reference to upper case and the slug to lower case", () => {
    const result = parse({ sku: "qc-ctm-001", slug: "Cartier-Tank-Must" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sku).toBe("QC-CTM-001");
      expect(result.data.slug).toBe("cartier-tank-must");
    }
  });

  it("rejects a slug with spaces or punctuation, which would break the URL", () => {
    expect(errorFor(parse({ slug: "cartier tank" }), "slug")).toBeDefined();
    expect(errorFor(parse({ slug: "cartier/tank" }), "slug")).toBeDefined();
  });

  it("requires a price above zero", () => {
    expect(errorFor(parse({ price: "0" }), "price")).toBeDefined();
    expect(errorFor(parse({ price: "" }), "price")).toBeDefined();
  });

  it("treats an empty compare-at price as not set rather than zero", () => {
    const result = parse({ compareAtPrice: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.compareAtPrice).toBeUndefined();
  });

  it("refuses a compare-at price that would advertise a fake saving", () => {
    expect(errorFor(parse({ compareAtPrice: "40000" }), "compareAtPrice")).toBeDefined();
    expect(parse({ compareAtPrice: "48000" }).success).toBe(true);
  });

  it("will not publish a piece with no photography", () => {
    expect(errorFor(parse({ status: "ACTIVE" }), "images")).toBeDefined();
    expect(
      parse({
        status: "ACTIVE",
        images: [{ url: "/uploads/tank.jpg", alt: "Cartier Tank Must on a navy tie" }],
      }).success,
    ).toBe(true);
  });

  it("insists on alt text long enough to describe the image", () => {
    const result = parse({ images: [{ url: "/uploads/tank.jpg", alt: "a" }] });
    expect(errorFor(result, "images.0.alt")).toBeDefined();
  });

  it("rejects fractional or negative stock", () => {
    expect(parse({ stock: "1.5" }).success).toBe(false);
    expect(parse({ stock: "-1" }).success).toBe(false);
  });

  it("keeps SEO copy within the length search engines will show", () => {
    expect(parse({ seoTitle: "x".repeat(71) }).success).toBe(false);
    expect(parse({ seoDescription: "x".repeat(181) }).success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const order = {
    name: "Ayesha Khan",
    email: "Shopper@Example.com",
    phone: "+92 300 1234567",
    line1: "12 Zamzama Boulevard",
    line2: "",
    city: "Karachi",
    region: "Sindh",
    postalCode: "75500",
    notes: "",
    couponCode: "",
    paymentMethod: "cod",
    acceptTerms: true as const,
  };

  it("accepts a complete address and normalises the email", () => {
    const result = checkoutSchema.safeParse(order);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("shopper@example.com");
  });

  it("rejects an address the courier cannot use", () => {
    expect(checkoutSchema.safeParse({ ...order, line1: "12" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...order, city: "" }).success).toBe(false);
  });

  it("rejects an unreachable email or phone", () => {
    expect(checkoutSchema.safeParse({ ...order, email: "shopper@" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...order, phone: "123" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...order, phone: "0300-abc-1234" }).success).toBe(false);
  });

  it("will not place an order without accepted terms", () => {
    expect(checkoutSchema.safeParse({ ...order, acceptTerms: false }).success).toBe(false);
  });

  it("requires a payment method to be chosen", () => {
    expect(checkoutSchema.safeParse({ ...order, paymentMethod: "" }).success).toBe(false);
  });
});

describe("payment providers", () => {
  it("offers cash on delivery by default and resolves it by id", () => {
    const providers = availablePaymentProviders({ currency: "PKR", amount: 2_450_000 });
    expect(providers.map((provider) => provider.id)).toContain("cod");
    expect(getPaymentProvider("cod")?.label).toBeTruthy();
  });

  it("refuses a provider that is not switched on, so a forged form cannot select one", () => {
    expect(getPaymentProvider("stripe")).toBeNull();
    expect(getPaymentProvider("")).toBeNull();
  });
});

describe("contactSchema", () => {
  const message = {
    name: "Ayesha Khan",
    email: "shopper@example.com",
    phone: "",
    subject: "About a specific piece",
    message: "Is the Tank Must still available in the black dial?",
  };

  it("accepts an enquiry without a phone number", () => {
    expect(contactSchema.safeParse(message).success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(contactSchema.safeParse({ ...message, message: "  " }).success).toBe(false);
  });

  it("rejects a subject outside the published list", () => {
    expect(contactSchema.safeParse({ ...message, subject: "Anything else" }).success).toBe(false);
  });
});
