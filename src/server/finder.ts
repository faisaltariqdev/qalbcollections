import { toMajorUnits } from "@/lib/money";
import { parseProductQuery, type RawSearchParams } from "@/lib/product-query";
import { getSiteSettings } from "@/lib/settings";
import { getFacets, listProducts, listTags } from "@/server/catalog";
import type { ProductCardData } from "@/server/catalog-types";

/**
 * "Find your timepiece".
 *
 * A guided way to build the same query string the listing pages use — the answers
 * are `tag`, `price_min/max` and `attr_*` parameters, nothing bespoke. That means
 * a finished path is a shareable, filterable listing URL, the flow works without
 * JavaScript, and adding a question for a future category is a data change rather
 * than new code.
 */

export interface FinderOption {
  value: string;
  label: string;
  hint?: string;
}

export interface FinderStep {
  /** Query parameter this step writes. */
  param: string;
  question: string;
  helper: string;
  options: FinderOption[];
}

/** Steps in order. Attribute steps are dropped when the catalogue cannot answer them. */
const ATTRIBUTE_STEPS: { key: string; question: string; helper: string }[] = [
  {
    key: "movement",
    question: "How should it keep time?",
    helper:
      "Automatic winds itself from the movement of your wrist. Quartz runs on a battery and asks nothing of you.",
  },
  {
    key: "strap-material",
    question: "Leather or metal?",
    helper: "Leather softens a formal watch. A bracelet takes more wear and dresses down easily.",
  },
  {
    key: "gender",
    question: "Who is it for?",
    helper: "This affects case size and proportion more than anything else.",
  },
];

/**
 * Three brackets across the live catalogue range, so the question never offers a
 * budget nothing is priced at. Bracket bounds are major units, matching the
 * `price_min`/`price_max` parameters the listing pages already use.
 */
function priceBrackets(minMinor: number, maxMinor: number, currency: string): FinderOption[] {
  const min = toMajorUnits(minMinor, currency);
  const max = toMajorUnits(maxMinor, currency);
  if (max <= min) return [];

  const round = (value: number) => Math.max(1000, Math.round(value / 1000) * 1000);
  const first = round(min + (max - min) / 3);
  const second = round(min + ((max - min) * 2) / 3);
  if (second <= first) return [];

  const format = (major: number) =>
    `${currency === "PKR" ? "Rs " : ""}${new Intl.NumberFormat("en-PK", {
      maximumFractionDigits: 0,
    }).format(major)}`;

  return [
    { value: `0-${first}`, label: `Up to ${format(first)}`, hint: "Entry to mid" },
    { value: `${first}-${second}`, label: `${format(first)} – ${format(second)}` },
    { value: `${second}-0`, label: `${format(second)} and above`, hint: "The upper catalogue" },
    { value: "any", label: "No budget in mind" },
  ];
}

export interface FinderState {
  steps: FinderStep[];
  /** Index of the first unanswered step, or `steps.length` once complete. */
  position: number;
  complete: boolean;
  answers: RawSearchParams;
  matches: ProductCardData[];
  total: number;
  /** The equivalent listing URL, for shoppers who want the full filter rail. */
  listingHref: string;
}

export async function buildFinderState(
  params: RawSearchParams,
  categorySlug = "watches",
): Promise<FinderState> {
  const settings = await getSiteSettings();
  const [styleTags, facets] = await Promise.all([
    listTags("style"),
    getFacets({ categorySlug, includeComingSoon: false }),
  ]);

  const steps: FinderStep[] = [];

  if (styleTags.length > 1) {
    steps.push({
      param: "tag",
      question: "What is it for?",
      helper: "Start with the life the watch has to fit into, not the specification.",
      options: styleTags.map((tag) => ({ value: tag.slug, label: tag.label })),
    });
  }

  const priceFacet = facets.find((facet) => facet.param === "price");
  if (priceFacet?.range) {
    const brackets = priceBrackets(priceFacet.range.min, priceFacet.range.max, settings.currency);
    if (brackets.length > 0) {
      steps.push({
        param: "budget",
        question: "What are you comfortable spending?",
        helper: "An honest number here is worth more than a long list of maybes.",
        options: brackets,
      });
    }
  }

  for (const step of ATTRIBUTE_STEPS) {
    const facet = facets.find((candidate) => candidate.param === `attr_${step.key}`);
    if (!facet || facet.options.length < 2) continue;
    steps.push({
      param: facet.param,
      question: step.question,
      helper: step.helper,
      options: [
        ...facet.options.map((option) => ({ value: option.value, label: option.label })),
        { value: "any", label: "No preference" },
      ],
    });
  }

  const answered = (param: string) => {
    const value = params[param];
    if (param === "budget") return params.price_min !== undefined || params.price_max !== undefined || params.budget !== undefined;
    return value !== undefined && value !== "";
  };

  const forced = params.results === "1";
  const firstUnanswered = steps.findIndex((step) => !answered(step.param));
  const position = firstUnanswered === -1 ? steps.length : firstUnanswered;
  const complete = forced || position >= steps.length;

  // "any" is a recorded non-answer: it advances the flow without filtering.
  const effective: RawSearchParams = Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) => value !== "any" && key !== "results" && key !== "budget",
    ),
  );

  const query = {
    ...parseProductQuery(effective, { currency: settings.currency, perPage: 6 }),
    categorySlug,
    includeComingSoon: false,
    sort: "featured" as const,
  };

  const { products, total } = complete ? await listProducts(query) : { products: [], total: 0 };

  const listingParams = new URLSearchParams();
  for (const [key, value] of Object.entries(effective)) {
    if (typeof value === "string") listingParams.append(key, value);
    else if (Array.isArray(value)) for (const entry of value) listingParams.append(key, entry);
  }
  const listingQuery = listingParams.toString();

  return {
    steps,
    position,
    complete,
    answers: params,
    matches: products,
    total,
    listingHref: `/${categorySlug}${listingQuery ? `?${listingQuery}` : ""}`,
  };
}

/** Translates a budget bracket answer into the price parameters the query uses. */
export function budgetToParams(value: string): Record<string, string> {
  if (value === "any") return { budget: "any" };
  const [min, max] = value.split("-").map((part) => Number.parseInt(part, 10));
  const params: Record<string, string> = { budget: value };
  if (min) params.price_min = String(min);
  if (max) params.price_max = String(max);
  return params;
}
