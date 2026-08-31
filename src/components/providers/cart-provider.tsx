"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { track } from "@/lib/analytics";
import { addToCart } from "@/server/actions/cart-actions";

/**
 * Client mirror of the server cart.
 *
 * The cart itself lives in the database; this holds only the badge summary so
 * the header can stay out of the server-rendered page shell (keeping pages
 * cacheable) while still updating the moment something is added.
 */

interface CartSummary {
  itemCount: number;
  subtotal: number;
  currency: string;
}

interface CartContextValue {
  summary: CartSummary;
  ready: boolean;
  pending: boolean;
  refresh: () => Promise<void>;
  add: (input: {
    productId: string;
    quantity?: number;
    name: string;
    brand: string;
    price: number;
    currency: string;
    category?: string;
  }) => Promise<boolean>;
}

const EMPTY: CartSummary = { itemCount: 0, subtotal: 0, currency: "PKR" };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<CartSummary>(EMPTY);
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (!response.ok) return;
      setSummary((await response.json()) as CartSummary);
    } catch {
      // Offline or aborted; the badge simply keeps its last known value.
    } finally {
      setReady(true);
    }
  }, []);

  // First read of the server-side bag. Written as a promise chain rather than an
  // awaited call so nothing is set synchronously while the effect runs, and so
  // an in-flight request is abandoned if the provider unmounts.
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/cart", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<CartSummary>) : null))
      .then((data) => {
        if (data) setSummary(data);
        setReady(true);
      })
      .catch(() => {
        // Offline or aborted; the badge stays hidden rather than showing zero.
      });

    return () => controller.abort();
  }, []);

  const add: CartContextValue["add"] = useCallback(
    async (input) => {
      const result = await addToCart({
        productId: input.productId,
        quantity: input.quantity ?? 1,
      });

      if (!result.ok) {
        toast.error(result.message ?? "That could not be added.");
        return false;
      }

      track("add_to_cart", {
        item: {
          id: input.productId,
          name: input.name,
          brand: input.brand,
          price: input.price,
          currency: input.currency,
          category: input.category,
          quantity: input.quantity ?? 1,
        },
      });

      // Optimistic badge, then reconcile with the server.
      setSummary((current) => ({
        ...current,
        itemCount: current.itemCount + (input.quantity ?? 1),
      }));

      toast.success(result.message ?? "Added to your bag", {
        action: { label: "View bag", onClick: () => router.push("/cart") },
      });

      await refresh();
      startTransition(() => router.refresh());
      return true;
    },
    [refresh, router],
  );

  const value = useMemo(
    () => ({ summary, ready, pending, refresh, add }),
    [summary, ready, pending, refresh, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
