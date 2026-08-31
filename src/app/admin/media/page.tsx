import Link from "next/link";

import { AdminEmpty, PageHeader } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  await requireAdminPage("media.write");
  const { folder } = await searchParams;

  const [assets, folders] = await Promise.all([
    db.mediaAsset.findMany({
      where: folder ? { folder } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.mediaAsset.groupBy({ by: ["folder"], _count: { _all: true } }),
  ]);

  // One pass to find out where each file is used, so a delete can be refused
  // with a reason rather than silently breaking a page.
  const urls = assets.map((asset) => asset.url);
  const [productImages, banners, categories, collections, posts] = await Promise.all([
    db.productImage.groupBy({ by: ["url"], where: { url: { in: urls } }, _count: { _all: true } }),
    db.banner.groupBy({ by: ["imageUrl"], where: { imageUrl: { in: urls } }, _count: { _all: true } }),
    db.category.groupBy({ by: ["imageUrl"], where: { imageUrl: { in: urls } }, _count: { _all: true } }),
    db.collection.groupBy({ by: ["imageUrl"], where: { imageUrl: { in: urls } }, _count: { _all: true } }),
    db.blogPost.groupBy({ by: ["coverImage"], where: { coverImage: { in: urls } }, _count: { _all: true } }),
  ]);

  const usage = new Map<string, number>();
  const counted: { url: string | null; count: number }[] = [
    ...productImages.map((row) => ({ url: row.url, count: row._count._all })),
    ...banners.map((row) => ({ url: row.imageUrl, count: row._count._all })),
    ...categories.map((row) => ({ url: row.imageUrl, count: row._count._all })),
    ...collections.map((row) => ({ url: row.imageUrl, count: row._count._all })),
    ...posts.map((row) => ({ url: row.coverImage, count: row._count._all })),
  ];
  for (const row of counted) {
    if (row.url) usage.set(row.url, (usage.get(row.url) ?? 0) + row.count);
  }

  return (
    <>
      <PageHeader
        title="Media"
        description="Every image the storefront uses. Files are stored exactly as supplied — Next.js handles sizing and modern formats at delivery, so product detail is never re-compressed here."
      />

      {folders.length > 1 ? (
        <nav aria-label="Folders" className="mb-6 flex flex-wrap gap-2">
          <FolderLink href="/admin/media" active={!folder}>
            All
          </FolderLink>
          {folders
            .sort((a, b) => a.folder.localeCompare(b.folder))
            .map((entry) => (
              <FolderLink
                key={entry.folder}
                href={`/admin/media?folder=${entry.folder}`}
                active={folder === entry.folder}
              >
                {entry.folder} ({entry._count._all})
              </FolderLink>
            ))}
        </nav>
      ) : null}

      {assets.length === 0 ? (
        <AdminEmpty
          title="Nothing uploaded yet"
          description="Upload product photography and it will appear here, ready to place on products, categories and journal posts."
        />
      ) : (
        <MediaLibrary
          folder={folder}
          assets={assets.map((asset) => ({
            id: asset.id,
            url: asset.url,
            filename: asset.filename,
            alt: asset.alt,
            folder: asset.folder,
            width: asset.width,
            height: asset.height,
            sizeBytes: asset.sizeBytes,
            usedBy: usage.get(asset.url) ?? 0,
          }))}
        />
      )}
    </>
  );
}

function FolderLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "eyebrow border px-3 py-1.5 text-[0.5rem] transition-colors",
        active
          ? "border-ink bg-ink text-canvas"
          : "border-line text-muted hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
