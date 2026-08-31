"use client";

import { useEffect, useRef } from "react";

import { track, type AnalyticsEventName, type AnalyticsPayload } from "@/lib/analytics";

/**
 * Fires one analytics event when a server-rendered page mounts.
 *
 * A leaf client component so the pages that report milestones — product views,
 * completed finder runs — stay Server Components. The event fires once per
 * mount; re-renders with the same payload do not duplicate it.
 */
export function TrackEvent<E extends AnalyticsEventName>({
  name,
  payload,
}: {
  name: E;
  payload: AnalyticsPayload<E>;
}) {
  const fired = useRef<string | null>(null);
  const signature = `${name}:${JSON.stringify(payload)}`;

  useEffect(() => {
    if (fired.current === signature) return;
    fired.current = signature;
    track(name, payload);
    // `signature` covers both inputs; payload is a plain object rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return null;
}
