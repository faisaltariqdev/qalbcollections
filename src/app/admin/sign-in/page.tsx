import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminSignInForm } from "@/components/admin/admin-sign-in-form";
import { Logo } from "@/components/layout/logo";
import { getAdminIdentity } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Qalb Collections admin",
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getAdminIdentity()) redirect("/admin");

  const { next } = await searchParams;
  // Same-site paths only, so `next` cannot become an open redirect.
  const redirectTo =
    next?.startsWith("/admin") && !next.startsWith("/admin/sign-in") ? next : "/admin";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-shell px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>

        <div className="mt-10 border border-line bg-canvas p-8">
          <h1 className="font-display text-2xl font-light text-ink">Administration</h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Authorised staff only. Every action here is recorded.
          </p>
          <div className="mt-8">
            <AdminSignInForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
    </main>
  );
}
