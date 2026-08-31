"use client";

import Link from "next/link";
import { Heart, ShoppingBag, User } from "lucide-react";

import { SearchDialog } from "@/components/search/search-dialog";
import { useCart } from "@/components/providers/cart-provider";
import { useSession } from "@/hooks/use-session";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

function Count({ value }: { value: number }) {
  return (
    <span
      className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-burgundy px-1 text-[0.625rem] font-bold leading-none text-nav"
      data-numeric
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

/**
 * Utility icons from the reference.
 *
 * Thin white line icons; bag always shows a champagne gold badge with the count
 * (zero is shown as 0 per the reference).
 */
export function HeaderActions() {
  const { summary, ready } = useCart();
  const wishlist = useWishlist();
  const { signedIn } = useSession();

  const iconClass =
    "relative flex size-10 items-center justify-center text-ink/85 transition-opacity duration-300 hover:opacity-65";

  return (
    <div className="flex items-center gap-0.5">
      <SearchDialog triggerClassName={iconClass} />

      <Link
        href={signedIn ? "/account" : "/sign-in"}
        className={cn(iconClass, "hidden sm:flex")}
        aria-label={signedIn ? "Your account" : "Sign in"}
      >
        <User className="size-[18px]" strokeWidth={1.5} />
      </Link>

      <Link href="/wishlist" className={iconClass} aria-label="Wishlist">
        <Heart className="size-[18px]" strokeWidth={1.5} />
        {wishlist.ready && wishlist.count > 0 ? <Count value={wishlist.count} /> : null}
      </Link>

      <Link href="/cart" className={iconClass} aria-label="Your bag">
        <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
        <Count value={ready ? summary.itemCount : 0} />
      </Link>
    </div>
  );
}
