import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { DeleteRecordButton } from "@/components/admin/delete-record-button";
import { PageForm } from "@/components/admin/page-form";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage("content.write");
  const { id } = await params;

  const page = await db.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Pages", href: "/admin/pages" }}
        title={page.title}
        description={`Last edited ${formatDate(page.updatedAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${page.slug}`} prefetch={false} target="_blank">
                View
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
            <DeleteRecordButton
              kind="page"
              recordId={page.id}
              name={page.title}
              redirectTo="/admin/pages"
            />
          </div>
        }
      />
      <PageForm
        pageId={page.id}
        initial={{
          title: page.title,
          slug: page.slug,
          body: page.body,
          status: page.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
          seoTitle: page.seoTitle ?? "",
          seoDescription: page.seoDescription ?? "",
          canonicalUrl: page.canonicalUrl ?? "",
          noIndex: page.noIndex,
        }}
      />
    </>
  );
}
