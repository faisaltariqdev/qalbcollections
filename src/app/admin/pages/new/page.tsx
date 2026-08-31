import { PageForm } from "@/components/admin/page-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";

export default async function NewPagePage() {
  await requireAdminPage("content.write");

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Pages", href: "/admin/pages" }}
        title="New page"
        description="Published pages are reachable at their slug and included in the sitemap."
      />
      <PageForm
        initial={{
          title: "",
          slug: "",
          body: "",
          status: "DRAFT",
          seoTitle: "",
          seoDescription: "",
          canonicalUrl: "",
          noIndex: false,
        }}
      />
    </>
  );
}
