import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { requireCustomerPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Your profile",
  description: "Your Qalb Collections contact details and password.",
  path: "/account/profile",
  noIndex: true,
});

export default async function AccountProfilePage() {
  const identity = await requireCustomerPage("/account/profile");
  const customer = await db.customer.findUnique({
    where: { id: identity.id },
    select: {
      name: true,
      email: true,
      phone: true,
      marketingOptIn: true,
      passwordHash: true,
      createdAt: true,
    },
  });
  if (!customer) notFound();

  return (
    <div className="max-w-md space-y-16">
      <section>
        <h2 className="eyebrow border-b border-line pb-3 text-ink">Your details</h2>
        <div className="mt-8">
          <ProfileForm
            defaults={{
              name: customer.name,
              email: customer.email,
              phone: customer.phone ?? "",
              marketingOptIn: customer.marketingOptIn,
            }}
          />
        </div>
      </section>

      {customer.passwordHash ? (
        <section>
          <h2 className="eyebrow border-b border-line pb-3 text-ink">Password</h2>
          <p className="mt-6 text-xs leading-relaxed text-faint">
            Changing your password signs you out everywhere else.
          </p>
          <div className="mt-7">
            <PasswordForm />
          </div>
        </section>
      ) : null}

      <p className="text-xs text-faint">Account created {formatDate(customer.createdAt)}</p>
    </div>
  );
}
