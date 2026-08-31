import type { ReactNode } from "react";

import { AccountNav } from "@/components/account/account-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, Eyebrow, GiltRule } from "@/components/ui/primitives";
import { requireCustomerPage } from "@/lib/auth/guards";

/**
 * Everything under /account is behind the session and never cached: one gate
 * here rather than a repeated check in each page.
 */
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const customer = await requireCustomerPage();

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Account", path: "/account" }]} />
      <div className="border-b border-line bg-shell">
        <Container className="py-14 sm:py-16">
          <Eyebrow className="text-qalb">Your account</Eyebrow>
          <h1 className="mt-5 text-display-md text-ink">{customer.name}</h1>
          <GiltRule className="mt-7" />
          <p className="mt-6 text-sm text-muted">{customer.email}</p>
        </Container>
      </div>

      <Container className="py-12 lg:py-16">
        <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-20">
          <AccountNav />
          <div className="mt-10 min-w-0 lg:mt-0">{children}</div>
        </div>
      </Container>
    </>
  );
}
