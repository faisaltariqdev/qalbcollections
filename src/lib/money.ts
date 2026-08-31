/**
 * Money handling.
 *
 * Every amount that crosses a module boundary is an integer in the currency's
 * minor unit (paisa, cents, fils). Floats are only ever produced at the last
 * moment for display, which keeps totals, discounts and tax exact.
 *
 * Adding a currency is a single entry here — no component hard-codes a symbol.
 */

export type CurrencyCode = "PKR" | "USD" | "AED" | "GBP" | "EUR" | "SAR";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  /** Digits in the minor unit: 2 for cents, 0 for zero-decimal currencies. */
  decimals: number;
  locale: string;
  /** Whether prices are conventionally shown without minor units. */
  hideMinorUnits: boolean;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  PKR: { code: "PKR", symbol: "Rs", decimals: 2, locale: "en-PK", hideMinorUnits: true },
  USD: { code: "USD", symbol: "$", decimals: 2, locale: "en-US", hideMinorUnits: false },
  AED: { code: "AED", symbol: "AED", decimals: 2, locale: "en-AE", hideMinorUnits: false },
  GBP: { code: "GBP", symbol: "£", decimals: 2, locale: "en-GB", hideMinorUnits: false },
  EUR: { code: "EUR", symbol: "€", decimals: 2, locale: "en-IE", hideMinorUnits: false },
  SAR: { code: "SAR", symbol: "SAR", decimals: 2, locale: "en-SA", hideMinorUnits: false },
};

export const DEFAULT_CURRENCY: CurrencyCode = "PKR";

export function getCurrency(code: string | null | undefined): CurrencyConfig {
  if (code && code in CURRENCIES) return CURRENCIES[code as CurrencyCode];
  return CURRENCIES[DEFAULT_CURRENCY];
}

/** Converts a human-entered major-unit amount ("24500.50") to minor units. */
export function toMinorUnits(amount: number | string, code: string = DEFAULT_CURRENCY): number {
  const { decimals } = getCurrency(code);
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10 ** decimals);
}

export function toMajorUnits(minor: number, code: string = DEFAULT_CURRENCY): number {
  const { decimals } = getCurrency(code);
  return minor / 10 ** decimals;
}

/**
 * Formats a minor-unit amount for display, e.g. `formatMoney(2450000)` →
 * "Rs 24,500". Zero-decimal display is used for PKR, where fractional rupees
 * are not quoted at retail.
 */
export function formatMoney(
  minor: number,
  code: string = DEFAULT_CURRENCY,
  options: { showDecimals?: boolean } = {},
) {
  const currency = getCurrency(code);
  const showDecimals = options.showDecimals ?? !currency.hideMinorUnits;
  const fractionDigits = showDecimals ? currency.decimals : 0;

  const formatted = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(toMajorUnits(minor, currency.code));

  return `${currency.symbol} ${formatted}`;
}

/** Machine-readable price for JSON-LD and Open Graph (always major units). */
export function priceForStructuredData(minor: number, code: string = DEFAULT_CURRENCY) {
  const currency = getCurrency(code);
  return toMajorUnits(minor, currency.code).toFixed(currency.decimals);
}

export function discountPercent(price: number, compareAtPrice: number | null | undefined) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export interface LineInput {
  unitPrice: number;
  quantity: number;
}

export interface CouponInput {
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal?: number;
}

export interface TotalsInput {
  lines: readonly LineInput[];
  /** Flat shipping in minor units; ignored when the free-shipping bar is met. */
  shippingFlat?: number;
  freeShippingThreshold?: number | null;
  coupon?: CouponInput | null;
  taxRateBps?: number;
}

export interface Totals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  itemCount: number;
}

/**
 * The single implementation of order arithmetic, shared by the cart, checkout
 * and admin so a total can never be computed two different ways.
 *
 * Order of operations: subtotal → discount → shipping (on the discounted
 * subtotal) → tax (on discounted subtotal + shipping).
 */
export function calculateTotals({
  lines,
  shippingFlat = 0,
  freeShippingThreshold = null,
  coupon = null,
  taxRateBps = 0,
}: TotalsInput): Totals {
  const subtotal = lines.reduce(
    (sum, line) => sum + Math.max(0, line.unitPrice) * Math.max(0, line.quantity),
    0,
  );
  const itemCount = lines.reduce((sum, line) => sum + Math.max(0, line.quantity), 0);

  let discountTotal = 0;
  if (coupon && subtotal >= (coupon.minSubtotal ?? 0)) {
    discountTotal =
      coupon.type === "PERCENT"
        ? Math.round((subtotal * Math.min(Math.max(coupon.value, 0), 100)) / 100)
        : Math.max(0, coupon.value);
    discountTotal = Math.min(discountTotal, subtotal);
  }

  const discountedSubtotal = subtotal - discountTotal;

  const qualifiesForFreeShipping =
    freeShippingThreshold !== null && discountedSubtotal >= freeShippingThreshold;
  const shippingTotal = itemCount === 0 || qualifiesForFreeShipping ? 0 : Math.max(0, shippingFlat);

  const taxTotal = Math.round(((discountedSubtotal + shippingTotal) * Math.max(0, taxRateBps)) / 10_000);

  return {
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    total: discountedSubtotal + shippingTotal + taxTotal,
    itemCount,
  };
}
