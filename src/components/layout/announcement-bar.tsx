import { Truck } from "lucide-react";

/**
 * Thin announcement strip matching the lookbook posters.
 */
export function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-8 items-center justify-center gap-2 border-b border-champ/25 bg-void text-champ">
      <Truck className="size-3.5 text-champ" strokeWidth={1.5} />
      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-champ">
        Delivery across Pakistan
      </span>
    </div>
  );
}
