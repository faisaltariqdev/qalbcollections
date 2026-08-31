import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { DeleteRecordButton } from "@/components/admin/delete-record-button";
import { JournalForm } from "@/components/admin/journal-form";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import type { ContentStatus, JournalFormValues } from "@/lib/admin/content-schema";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function EditJournalPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("content.write");
  const { id } = await params;

  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  const initial: JournalFormValues = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    coverImage: post.coverImage ?? "",
    coverAlt: post.coverAlt ?? "",
    authorName: post.authorName,
    readMinutes: String(post.readMinutes),
    status: post.status as ContentStatus,
    featured: post.featured,
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    canonicalUrl: post.canonicalUrl ?? "",
    ogImageUrl: post.ogImageUrl ?? "",
    socialTitle: post.socialTitle ?? "",
    socialDescription: post.socialDescription ?? "",
    noIndex: post.noIndex,
  };

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Journal", href: "/admin/journal" }}
        title={post.title}
        description={
          post.publishedAt
            ? `Published ${formatDate(post.publishedAt)} · last edited ${formatDate(post.updatedAt)}`
            : `Draft · last edited ${formatDate(post.updatedAt)}`
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/journal/${post.slug}`} prefetch={false} target="_blank">
                View
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
            <DeleteRecordButton
              kind="journal"
              recordId={post.id}
              name={post.title}
              redirectTo="/admin/journal"
            />
          </div>
        }
      />
      <JournalForm postId={post.id} initial={initial} />
    </>
  );
}
