import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { AdminShell } from "@/components/admin/admin-shell";
import { can } from "@/lib/auth/permissions";
import { getAdminIdentity } from "@/lib/auth/session";

/** The admin area is never cached and never indexed. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Qalb Collections — administration",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminIdentity();

  // Without an identity the only reachable page is the sign-in screen, which
  // brings its own layout; `src/proxy.ts` redirects everything else.
  if (!admin) return <>{children}</>;

  // The sidebar shows only what this role may actually open. Every page and
  // action behind it checks the same permission again.
  const allowed = ADMIN_NAV.flatMap((section) => section.items)
    .filter((item) => can(admin.role, item.permission))
    .map((item) => item.href);

  return (
    <AdminShell
      admin={{ name: admin.name, email: admin.email, role: admin.role }}
      allowed={allowed}
    >
      {children}
    </AdminShell>
  );
}
