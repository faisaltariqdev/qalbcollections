"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * A list of product ids persisted in localStorage, shared across tabs and
 * across every component that reads the same key.
 *
 * Guest wishlists, the comparison tray and recently-viewed all use this, which
 * means none of them require an account — and none of them cost a request.
 *
 * localStorage is treated as the external store it is: components subscribe to
 * it rather than copying it into state, so every reader stays in step and the
 * server render is simply "not yet known".
 */

const CHANGE_EVENT = "qalb:local-collection";

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    // Private mode or blocked storage: behave like an empty list.
    return "";
  }
}

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage can be full or blocked in private mode; the feature degrades.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Null on the server and during hydration, which is what `ready` reports. */
const serverSnapshot = () => null;

export interface LocalCollection {
  ids: string[];
  /** False until the first client read, so SSR and hydration agree. */
  ready: boolean;
  has: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => boolean;
  /** Replaces the whole list, e.g. after merging with a server-side copy. */
  replace: (ids: readonly string[]) => void;
  clear: () => void;
  count: number;
}

export function useLocalCollection(key: string, max?: number): LocalCollection {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), serverSnapshot);
  const ids = useMemo(() => parse(raw), [raw]);

  const add = useCallback(
    (id: string) => {
      const current = parse(readRaw(key)).filter((entry) => entry !== id);
      // Newest first, so "recently viewed" needs no separate timestamp.
      const next = [id, ...current];
      write(key, max ? next.slice(0, max) : next);
    },
    [key, max],
  );

  const remove = useCallback(
    (id: string) => {
      write(
        key,
        parse(readRaw(key)).filter((entry) => entry !== id),
      );
    },
    [key],
  );

  const toggle = useCallback(
    (id: string) => {
      const current = parse(readRaw(key));
      if (current.includes(id)) {
        write(
          key,
          current.filter((entry) => entry !== id),
        );
        return false;
      }
      const next = [id, ...current];
      write(key, max ? next.slice(0, max) : next);
      return true;
    },
    [key, max],
  );

  const replace = useCallback(
    (next: readonly string[]) => {
      const unique = [...new Set(next)];
      write(key, max ? unique.slice(0, max) : unique);
    },
    [key, max],
  );

  const clear = useCallback(() => write(key, []), [key]);

  return {
    ids,
    ready: raw !== null,
    has: (id: string) => ids.includes(id),
    add,
    remove,
    toggle,
    replace,
    clear,
    count: ids.length,
  };
}
