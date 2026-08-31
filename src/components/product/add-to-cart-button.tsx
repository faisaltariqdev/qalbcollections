"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState, useTransition } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/primitives";

export interface AddToCartProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  category?: string;
  inStock: boolean;
  comingSoon: boolean;
}

/**
 * The single add-to-cart control, shared by the product page, quick view and
 * comparison table so the wording and disabled states never diverge.
 */
export function AddToCartButton({
  product,
  quantity = 1,
  size = "lg",
  variant = "primary",
  block = true,
  className,
}: {
  product: AddToCartProduct;
  quantity?: number;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  block?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  if (product.comingSoon) {
    return (
      <Button size={size} variant="outline" block={block} disabled className={className}>
        Not yet released
      </Button>
    );
  }

  if (!product.inStock) {
    return (
      <Button size={size} variant="outline" block={block} disabled className={className}>
        Sold out
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      block={block}
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const added = await add({
            productId: product.id,
            quantity,
            name: product.name,
            brand: product.brand,
            price: product.price,
            currency: product.currency,
            category: product.category,
          });
          if (added) {
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 2200);
          }
        })
      }
    >
      {pending ? (
        <Spinner className="size-3.5" />
      ) : justAdded ? (
        <Check className="size-4" />
      ) : (
        <ShoppingBag className="size-4" />
      )}
      {justAdded ? "In your bag" : "Add to bag"}
    </Button>
  );
}
