import { cache } from "react";

import { db } from "@/lib/db";

/** Navigation, announcements and footer groups, all editable in the admin. */

export interface NavLink {
  label: string;
  href: string;
  badge: string | null;
}

export interface NavGroup extends NavLink {
  children: NavLink[];
}

export const getHeaderNav = cache(async (): Promise<NavGroup[]> => {
  const items = await db.navItem.findMany({
    where: { location: "header", active: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  return items.map((item) => ({
    label: item.label,
    href: item.href,
    badge: item.badge,
    children: item.children.map((child) => ({
      label: child.label,
      href: child.href,
      badge: child.badge,
    })),
  }));
});

export const getFooterNav = cache(async (): Promise<{ group: string; items: NavLink[] }[]> => {
  const items = await db.navItem.findMany({
    where: { location: "footer", active: true },
    orderBy: { sortOrder: "asc" },
  });

  const groups: { group: string; items: NavLink[] }[] = [];
  for (const item of items) {
    const name = item.groupName ?? "More";
    let group = groups.find((entry) => entry.group === name);
    if (!group) {
      group = { group: name, items: [] };
      groups.push(group);
    }
    group.items.push({ label: item.label, href: item.href, badge: item.badge });
  }
  return groups;
});

export const getAnnouncements = cache(async () => {
  return db.announcement.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
});
