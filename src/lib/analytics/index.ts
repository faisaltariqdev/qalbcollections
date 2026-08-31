import { publicEnv } from "@/lib/env";

import type { AnalyticsEventName, AnalyticsPayload } from "./events";

export type { AnalyticsEventName, AnalyticsItem, AnalyticsPayload } from "./events";

type Sink = (event: string, payload: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: (command: string, event: string, params?: Record<string, unknown>) => void;
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

const sinks: Record<string, Sink> = {
  none: () => {},
  console: (event, payload) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[analytics] ${event}`, payload);
    }
  },
  gtag: (event, payload) => {
    window.gtag?.("event", event, payload);
  },
  plausible: (event, payload) => {
    window.plausible?.(event, { props: payload });
  },
};

/**
 * Records a product or funnel event. Safe to call from anywhere: it no-ops
 * during server rendering and never throws into the render path, because a
 * broken analytics vendor must not break the storefront.
 */
export function track<E extends AnalyticsEventName>(event: E, payload: AnalyticsPayload<E>) {
  if (typeof window === "undefined") return;
  const sink = sinks[publicEnv.NEXT_PUBLIC_ANALYTICS_PROVIDER] ?? sinks.none!;
  try {
    sink(event, payload as Record<string, unknown>);
  } catch {
    // Intentionally swallowed.
  }
}
