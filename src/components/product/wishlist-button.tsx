"use client";

import { Heart } from "lucide-react";

import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

/**
 * Wishlist toggle. Works for signed-out visitors (browser-local) and mirrors to
 * the account when signed in, so nothing is lost by not having an account.
 */
export function WishlistButton({
  productId,
  productName,
  variant = "overlay",
  className,
}: {
  productId: string;
  productName: string;
  variant?: "overlay" | "inline" | "bare";
  className?: string;
}) {
  const { has, toggle, ready } = useWishlist();
  const saved = ready && has(productId);

  return (
    <button
      type="button"
      onClick={(event) => {
        // Cards wrap the whole tile in a link.
        event.preventDefault();
        event.stopPropagation();
        toggle(productId, productName);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "group/wish flex items-center justify-center transition-all duration-300",
        variant === "overlay" &&
          "size-10 bg-canvas/85 text-ink backdrop-blur-sm hover:bg-canvas hover:text-champ",
        variant === "inline" &&
          "size-12 shrink-0 border border-line text-ink hover:border-ink hover:text-champ",
        variant === "bare" && "size-9 text-ash hover:text-champ",
        className,
      )}
    >
      <Heart
        className={cn("size-[17px] transition-all", saved && "fill-champ text-champ")}
        strokeWidth={1.5}
      />
    </button>
  );
}
