import { discountPercent, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Price display. Currency formatting is centralised in `lib/money`, so no
 * component ever hard-codes a symbol and a second currency needs no edits here.
 */
export function Price({
  price,
  compareAtPrice,
  currency,
  size = "md",
  className,
  showSaving = false,
}: {
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showSaving?: boolean;
}) {
  const saving = discountPercent(price, compareAtPrice);

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1", className)}>
      <span
        data-numeric
        className={cn(
          "text-ink",
          size === "sm" && "text-sm",
          size === "md" && "text-[0.9375rem]",
          size === "lg" && "font-display text-2xl",
        )}
      >
        {formatMoney(price, currency)}
      </span>

      {saving !== null && compareAtPrice ? (
        <>
          <s
            data-numeric
            className={cn("text-faint", size === "lg" ? "text-base" : "text-xs")}
          >
            {formatMoney(compareAtPrice, currency)}
          </s>
          {showSaving ? (
            <span className="eyebrow text-[0.5625rem] text-qalb">{saving}% less</span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
