/**
 * The analytics contract. Event names and payload shapes are declared once so a
 * typo can never create a phantom metric, and any provider can be plugged in
 * behind `track()` without touching call sites.
 */

export interface AnalyticsItem {
  id: string;
  name: string;
  brand: string;
  category?: string;
  /** Minor units, matching the rest of the codebase. */
  price: number;
  currency: string;
  quantity?: number;
}

export interface AnalyticsEvents {
  product_view: { item: AnalyticsItem };
  product_search: { term: string; results: number };
  search_used: { term: string; source: "header" | "page" };
  add_to_cart: { item: AnalyticsItem };
  remove_from_cart: { item: AnalyticsItem };
  wishlist_add: { productId: string; name: string };
  wishlist_remove: { productId: string };
  compare_add: { productId: string };
  checkout_start: { value: number; currency: string; itemCount: number };
  purchase: { orderNumber: string; value: number; currency: string; itemCount: number };
  category_view: { slug: string; name: string; productCount: number };
  collection_view: { slug: string; name: string };
  filter_used: { facet: string; value: string };
  gift_guide_started: { entry: string };
  gift_guide_completed: { occasion: string; results: number };
  watch_finder_started: Record<string, never>;
  watch_finder_completed: { intent: string; results: number };
  notify_me_submitted: { topic: string };
  newsletter_subscribed: { source: string };
  quick_view_opened: { productId: string };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

export type AnalyticsPayload<E extends AnalyticsEventName> = AnalyticsEvents[E];
