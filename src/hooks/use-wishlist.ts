"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { STORAGE_KEYS } from "@/lib/constants";
import { track } from "@/lib/analytics";
import { mergeWishlist, syncWishlist } from "@/server/actions/wishlist-actions";

import { useLocalCollection } from "./use-local-collection";

/**
 * Wishlist. Guests keep it in their own browser; signed-in customers get the
 * same list mirrored to the database so it follows them between devices. The
 * local list stays authoritative for instant feedback either way.
 */
export function useWishlist() {
  const collection = useLocalCollection(STORAGE_KEYS.wishlist);

  const toggle = useCallback(
    (productId: string, name: string) => {
      const added = collection.toggle(productId);

      if (added) {
        track("wishlist_add", { productId, name });
        toast.success("Saved to your wishlist");
      } else {
        track("wishlist_remove", { productId });
        toast("Removed from your wishlist");
      }

      // Fire-and-forget: a signed-out visitor gets a no-op, and a failed sync
      // must never block the interaction.
      void syncWishlist({ productId, action: added ? "add" : "remove" }).catch(() => {});

      return added;
    },
    [collection],
  );

  /**
   * Called after signing in: pushes the guest list up, pulls the account list
   * down, and keeps the union. A no-op for signed-out visitors.
   */
  const sync = useCallback(async () => {
    try {
      const result = await mergeWishlist({ productIds: collection.ids });
      if (result.ok) collection.replace(result.productIds);
    } catch {
      // The local list is still intact; syncing again is safe.
    }
  }, [collection]);

  return { ...collection, toggle, sync };
}
