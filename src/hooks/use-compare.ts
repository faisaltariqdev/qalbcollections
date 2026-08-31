"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { track } from "@/lib/analytics";
import { MAX_COMPARE_ITEMS, STORAGE_KEYS } from "@/lib/constants";

import { useLocalCollection } from "./use-local-collection";

/**
 * Comparison tray. Capped at four pieces, because a comparison table wider than
 * that stops being readable on any screen — and the cap is enforced here rather
 * than left to the UI.
 */
export function useCompare() {
  const collection = useLocalCollection(STORAGE_KEYS.compare);

  const toggle = useCallback(
    (productId: string) => {
      if (collection.has(productId)) {
        collection.remove(productId);
        return false;
      }

      if (collection.count >= MAX_COMPARE_ITEMS) {
        toast.error(`Compare up to ${MAX_COMPARE_ITEMS} pieces at a time.`);
        return false;
      }

      collection.add(productId);
      track("compare_add", { productId });
      return true;
    },
    [collection],
  );

  return { ...collection, toggle, full: collection.count >= MAX_COMPARE_ITEMS };
}
