"use client";

import { useEffect } from "react";

import { useLocalCollection } from "@/hooks/use-local-collection";
import { MAX_RECENTLY_VIEWED, STORAGE_KEYS } from "@/lib/constants";

/**
 * Records a product view in the visitor's own browser.
 *
 * Kept client-side and account-free: recently viewed is a convenience, not a
 * profile, so it costs no request and follows nobody around.
 */
export function RecordProductView({ productId }: { productId: string }) {
  const { add } = useLocalCollection(STORAGE_KEYS.recentlyViewed, MAX_RECENTLY_VIEWED);

  useEffect(() => {
    add(productId);
  }, [add, productId]);

  return null;
}

/**
 * Mounted once in the storefront layout so the storage listener exists on every
 * page and the header/rail counts stay in step across tabs.
 */
export function RecentlyViewedRecorder() {
  useLocalCollection(STORAGE_KEYS.recentlyViewed, MAX_RECENTLY_VIEWED);
  return null;
}
