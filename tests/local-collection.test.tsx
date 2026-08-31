import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useLocalCollection } from "@/hooks/use-local-collection";

/**
 * The guest wishlist, comparison tray and recently-viewed rail all sit on this
 * one store, so its behaviour is asserted once, here.
 */

const KEY = "qalb:test-collection";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useLocalCollection", () => {
  it("starts empty and reports itself ready on the client", () => {
    const { result } = renderHook(() => useLocalCollection(KEY));
    expect(result.current.ids).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.ready).toBe(true);
  });

  it("adds newest first, so recently-viewed needs no timestamps", () => {
    const { result } = renderHook(() => useLocalCollection(KEY));
    act(() => result.current.add("a"));
    act(() => result.current.add("b"));
    expect(result.current.ids).toEqual(["b", "a"]);
  });

  it("moves a repeated id to the front instead of duplicating it", () => {
    const { result } = renderHook(() => useLocalCollection(KEY));
    act(() => result.current.add("a"));
    act(() => result.current.add("b"));
    act(() => result.current.add("a"));
    expect(result.current.ids).toEqual(["a", "b"]);
  });

  it("toggles a product in and out, reporting the new state", () => {
    const { result } = renderHook(() => useLocalCollection(KEY));
    let added = false;
    act(() => {
      added = result.current.toggle("a");
    });
    expect(added).toBe(true);
    expect(result.current.has("a")).toBe(true);

    act(() => {
      added = result.current.toggle("a");
    });
    expect(added).toBe(false);
    expect(result.current.has("a")).toBe(false);
  });

  it("drops the oldest entry once the cap is reached", () => {
    const { result } = renderHook(() => useLocalCollection(KEY, 2));
    act(() => result.current.add("a"));
    act(() => result.current.add("b"));
    act(() => result.current.add("c"));
    expect(result.current.ids).toEqual(["c", "b"]);
  });

  it("de-duplicates on replace, which is how a guest list merges with a saved one", () => {
    const { result } = renderHook(() => useLocalCollection(KEY));
    act(() => result.current.replace(["a", "b", "a", "c"]));
    expect(result.current.ids).toEqual(["a", "b", "c"]);
  });

  it("clears everything", () => {
    const { result } = renderHook(() => useLocalCollection(KEY));
    act(() => result.current.replace(["a", "b"]));
    act(() => result.current.clear());
    expect(result.current.ids).toEqual([]);
  });

  it("keeps two readers of the same key in step", () => {
    const first = renderHook(() => useLocalCollection(KEY));
    const second = renderHook(() => useLocalCollection(KEY));
    act(() => first.result.current.add("a"));
    expect(second.result.current.ids).toEqual(["a"]);
  });

  it("treats corrupt storage as an empty list rather than throwing", () => {
    window.localStorage.setItem(KEY, "{not json");
    const { result } = renderHook(() => useLocalCollection(KEY));
    expect(result.current.ids).toEqual([]);
  });

  it("ignores non-string entries left by an older version", () => {
    window.localStorage.setItem(KEY, JSON.stringify(["a", 7, null, "b"]));
    const { result } = renderHook(() => useLocalCollection(KEY));
    expect(result.current.ids).toEqual(["a", "b"]);
  });

  it("keeps separate keys separate", () => {
    const wishlist = renderHook(() => useLocalCollection("qalb:test-wishlist"));
    const compare = renderHook(() => useLocalCollection("qalb:test-compare"));
    act(() => wishlist.result.current.add("a"));
    expect(compare.result.current.ids).toEqual([]);
  });
});
