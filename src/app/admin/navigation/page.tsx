import { NavigationEditor } from "@/components/admin/navigation-editor";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export default async function AdminNavigationPage() {
  await requireAdminPage("content.write");

  const [items, announcements] = await Promise.all([
    db.navItem.findMany({ orderBy: [{ location: "asc" }, { sortOrder: "asc" }] }),
    db.announcement.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Navigation"
        description="How customers move through the site. Adding a category or collection to the menu is a link here, not a release."
      />
      <NavigationEditor items={items} announcements={announcements} />
    </>
  );
}
