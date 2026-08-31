import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { HeaderActions } from "@/components/layout/header-actions";
import { HeaderShell } from "@/components/layout/header";
import { LogoLink } from "@/components/layout/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";

/**
 * Storefront header matching the reference.
 *
 * Logo left on desktop, center on mobile. Navigation center on desktop.
 * Utility icons right. Transparent over the hero and solid dark once scrolled.
 */
export async function SiteHeader() {
  return (
    <>
      <AnnouncementBar />

      <HeaderShell>
        <div className="shell-x relative mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 sm:h-20">
          <div className="flex w-20 items-center lg:hidden">
            <MobileMenu />
          </div>

          <LogoLink className="absolute left-1/2 shrink-0 -translate-x-1/2 lg:static lg:left-0 lg:translate-x-0" />

          <DesktopNav />

          <HeaderActions />
        </div>
      </HeaderShell>
    </>
  );
}
