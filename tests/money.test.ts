import { describe, expect, it } from "vitest";

import {
  calculateTotals,
  discountPercent,
  formatMoney,
  priceForStructuredData,
  toMajorUnits,
  toMinorUnits,
} from "@/lib/money";

/**
 * Money is the part of the system where a rounding mistake is a real loss, so
 * the arithmetic is pinned down here rather than trusted.
 */

describe("unit conversion", () => {
  it("converts major units to minor units without floating-point drift", () => {
    expect(toMinorUnits(24_500.5, "PKR")).toBe(2_450_050);
    expect(toMinorUnits("0.07", "USD")).toBe(7);
    expect(toMinorUnits(0.1 + 0.2, "USD")).toBe(30);
  });

  it("treats unparseable input as zero rather than NaN", () => {
    expect(toMinorUnits("not a number")).toBe(0);
  });

  it("round-trips", () => {
    expect(toMajorUnits(toMinorUnits(1999.99, "USD"), "USD")).toBeCloseTo(1999.99, 2);
  });

  it("falls back to the default currency for an unknown code", () => {
    expect(toMinorUnits(10, "XYZ")).toBe(toMinorUnits(10, "PKR"));
  });
});

describe("formatting", () => {
  it("hides minor units for PKR, where fractional rupees are not quoted at retail", () => {
    expect(formatMoney(2_450_000, "PKR")).toBe("Rs 24,500");
  });

  it("shows minor units for currencies that quote them", () => {
    expect(formatMoney(199_999, "USD")).toBe("$ 1,999.99");
  });

  it("emits machine-readable prices in major units with fixed decimals", () => {
    expect(priceForStructuredData(2_450_000, "PKR")).toBe("24500.00");
    expect(priceForStructuredData(199_999, "USD")).toBe("1999.99");
  });
});

describe("discountPercent", () => {
  it("reports the saving against a higher was-price", () => {
    expect(discountPercent(7_500, 10_000)).toBe(25);
  });

  it("reports nothing when there is no genuine saving", () => {
    expect(discountPercent(10_000, 10_000)).toBeNull();
    expect(discountPercent(10_000, 9_000)).toBeNull();
    expect(discountPercent(10_000, null)).toBeNull();
  });
});

describe("calculateTotals", () => {
  const lines = [
    { unitPrice: 1_000_000, quantity: 2 },
    { unitPrice: 500_000, quantity: 1 },
  ];

  it("sums lines and counts items", () => {
    const totals = calculateTotals({ lines });
    expect(totals.subtotal).toBe(2_500_000);
    expect(totals.itemCount).toBe(3);
    expect(totals.total).toBe(2_500_000);
  });

  it("charges flat shipping below the free-shipping threshold", () => {
    const totals = calculateTotals({
      lines: [{ unitPrice: 100_000, quantity: 1 }],
      shippingFlat: 30_000,
      freeShippingThreshold: 1_000_000,
    });
    expect(totals.shippingTotal).toBe(30_000);
    expect(totals.total).toBe(130_000);
  });

  it("waives shipping once the threshold is met", () => {
    const totals = calculateTotals({
      lines,
      shippingFlat: 30_000,
      freeShippingThreshold: 1_000_000,
    });
    expect(totals.shippingTotal).toBe(0);
  });

  it("applies a percentage coupon to the subtotal", () => {
    const totals = calculateTotals({ lines, coupon: { type: "PERCENT", value: 10 } });
    expect(totals.discountTotal).toBe(250_000);
    expect(totals.total).toBe(2_250_000);
  });

  it("applies a fixed coupon in minor units", () => {
    const totals = calculateTotals({ lines, coupon: { type: "FIXED", value: 100_000 } });
    expect(totals.discountTotal).toBe(100_000);
  });

  it("ignores a coupon whose minimum is not met", () => {
    const totals = calculateTotals({
      lines: [{ unitPrice: 100_000, quantity: 1 }],
      coupon: { type: "PERCENT", value: 10, minSubtotal: 1_000_000 },
    });
    expect(totals.discountTotal).toBe(0);
  });

  it("never discounts more than the goods are worth", () => {
    const totals = calculateTotals({
      lines: [{ unitPrice: 100_000, quantity: 1 }],
      coupon: { type: "FIXED", value: 500_000 },
    });
    expect(totals.discountTotal).toBe(100_000);
    expect(totals.total).toBe(0);
  });

  it("caps a percentage coupon at 100 per cent", () => {
    const totals = calculateTotals({ lines, coupon: { type: "PERCENT", value: 500 } });
    expect(totals.discountTotal).toBe(2_500_000);
  });

  it("taxes the discounted subtotal plus shipping, not the list price", () => {
    const totals = calculateTotals({
      lines: [{ unitPrice: 1_000_000, quantity: 1 }],
      shippingFlat: 50_000,
      coupon: { type: "PERCENT", value: 10 },
      taxRateBps: 1_700,
    });
    // (1,000,000 − 100,000 + 50,000) × 17%
    expect(totals.taxTotal).toBe(161_500);
    expect(totals.total).toBe(1_111_500);
  });

  it("treats negative quantities and prices as zero rather than credits", () => {
    const totals = calculateTotals({
      lines: [
        { unitPrice: -100_000, quantity: 1 },
        { unitPrice: 100_000, quantity: -3 },
      ],
    });
    expect(totals.subtotal).toBe(0);
    expect(totals.total).toBe(0);
  });

  it("charges nothing to deliver an empty bag", () => {
    const totals = calculateTotals({ lines: [], shippingFlat: 30_000 });
    expect(totals.shippingTotal).toBe(0);
    expect(totals.total).toBe(0);
  });
});
