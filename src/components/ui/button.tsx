import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Storefront buttons — high-contrast type, solid fills, no hairline gold-on-cream.
 *
 * Primary is burgundy on cream (readable). Hover lifts to gold.
 * Outline is burgundy stroke. Inverse is for dark surfaces.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-sans font-semibold uppercase tracking-[0.12em] transition-all duration-300 ease-[var(--ease-luxe)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-burgundy text-nav shadow-[var(--shadow-lift)] hover:bg-champ hover:text-void hover:shadow-[var(--shadow-gild)] hover:-translate-y-px",
        secondary:
          "btn-gild hover:-translate-y-px",
        outline:
          "border border-burgundy text-burgundy hover:bg-burgundy hover:text-nav hover:shadow-[var(--shadow-lift)]",
        inverse:
          "bg-nav text-void shadow-[var(--shadow-lift)] hover:bg-champ hover:text-void hover:-translate-y-px",
        inverseOutline:
          "border border-champ/70 text-champ hover:bg-champ hover:text-void hover:border-champ",
        ghost:
          "text-ink hover:text-burgundy",
        quiet:
          "text-ink/70 hover:text-ink",
        link:
          "link-sweep p-0 h-auto font-medium tracking-normal normal-case text-ink",
        danger:
          "bg-danger text-nav shadow-[var(--shadow-lift)] hover:opacity-90",
      },
      size: {
        sm:   "h-11 px-5 text-[0.75rem]   [&_svg]:size-3.5",
        md:   "h-12 px-7 text-[0.8125rem] [&_svg]:size-4",
        lg:   "h-14 px-9 text-[0.875rem]  [&_svg]:size-4",
        icon: "size-11 [&_svg]:size-4",
        iconSm: "size-9 [&_svg]:size-3.5",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
