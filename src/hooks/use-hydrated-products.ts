"use client";

import { useEffect, useState } from "react";

/**
 * Turns a browser-held list of product ids into full records.
 *
 * The wishlist, comparison tray and recently-viewed rail all keep only ids
 * locally — which is what lets them work without an account — so each needs the
 * same hydration step. Returns `null` while the current selection is in flight
 * and `[]` when there is genuinely nothing selected, so callers can tell a
 * loading state from an empty one.
 */
export function useHydratedProducts<T>(
  endpoint: string,
  ids: readonly string[],
  ready: boolean,
): T[] | null {
  const key = ids.join(",");
  const [loaded, setLoaded] = useState<{ key: string; items: T[] }>({ key: "", items: [] });

  useEffect(() => {
    if (!ready || key === "") return;

    const controller = new AbortController();

    fetch(`${endpoint}?ids=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<T[]>) : []))
      .then((items) => setLoaded({ key, items }))
      .catch(() => {
        // Aborted or offline. The selection is still intact locally.
      });

    return () => controller.abort();
  }, [endpoint, key, ready]);

  if (!ready) return null;
  if (key === "") return [];
  return loaded.key === key ? loaded.items : null;
}
