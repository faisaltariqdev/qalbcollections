"use client";

import { useEffect, useState } from "react";

export interface SessionState {
  signedIn: boolean;
  isAdmin: boolean;
  ready: boolean;
}

/**
 * Header session state, fetched client-side so the server-rendered page shell
 * carries no visitor-specific data and stays cacheable.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    signedIn: false,
    isAdmin: false,
    ready: false,
  });

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        if (!response.ok || !active) return;
        const data = (await response.json()) as { signedIn: boolean; isAdmin: boolean };
        setState({ ...data, ready: true });
      } catch {
        if (active) setState((current) => ({ ...current, ready: true }));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
