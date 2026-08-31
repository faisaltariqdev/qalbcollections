import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminEmpty, PageHeader, Panel, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function AdminJournalPage() {
  await requireAdminPage("content.write");

  const posts = await db.blogPost.findMany({
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      status: true,
      featured: true,
      readMinutes: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Journal"
        description="Buying guides, care notes and product stories. This is the content that earns the site its own audience rather than borrowing one."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/journal/new">
              <Plus className="size-4" />
              New post
            </Link>
          </Button>
        }
      />

      {posts.length === 0 ? (
        <AdminEmpty
          title="Nothing published yet"
          description="Start with a guide your customers actually ask about — sizing, or automatic versus quartz."
          action={
            <Button asChild size="sm">
              <Link href="/admin/journal/new">New post</Link>
            </Button>
          }
        />
      ) : (
        <Panel>
          <TableWrap>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th>Published</Th>
                <Th className="text-right">Read</Th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <Td>
                    <Link href={`/admin/journal/${post.id}`} className="text-ink hover:underline">
                      {post.title}
                    </Link>
                    <span className="mt-0.5 block text-xs text-faint">/journal/{post.slug}</span>
                  </Td>
                  <Td className="text-xs">{post.category}</Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusPill
                        tone={
                          post.status === "ACTIVE"
                            ? "positive"
                            : post.status === "DRAFT"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {post.status === "ACTIVE" ? "Published" : post.status.toLowerCase()}
                      </StatusPill>
                      {post.featured ? <StatusPill>Featured</StatusPill> : null}
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                  </Td>
                  <Td className="text-right text-xs" data-numeric>
                    {post.readMinutes} min
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}
    </>
  );
}
