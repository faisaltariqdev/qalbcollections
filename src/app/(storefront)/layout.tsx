import { CartProvider } from "@/components/providers/cart-provider";
import { RecentlyViewedRecorder } from "@/components/product/recently-viewed";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CompareTray } from "@/components/product/compare-tray";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main id="main" className="flex-1 pt-24 sm:pt-28">
          {children}
        </main>
        <SiteFooter />
      </div>
      <CompareTray />
      <RecentlyViewedRecorder />
    </CartProvider>
  );
}
