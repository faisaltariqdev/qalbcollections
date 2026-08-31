import { JournalForm } from "@/components/admin/journal-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import type { JournalFormValues } from "@/lib/admin/content-schema";
import { getSiteSettings } from "@/lib/settings";

export default async function NewJournalPostPage() {
  await requireAdminPage("content.write");
  const settings = await getSiteSettings();

  const blank: JournalFormValues = {
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    category: "Guides",
    coverImage: "",
    coverAlt: "",
    authorName: settings.brandName,
    readMinutes: "4",
    status: "DRAFT",
    featured: false,
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    ogImageUrl: "",
    socialTitle: "",
    socialDescription: "",
    noIndex: false,
  };

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Journal", href: "/admin/journal" }}
        title="New journal post"
        description="Write it as a draft, read it back on the site, then publish."
      />
      <JournalForm initial={blank} />
    </>
  );
}
