import type { Permission } from "@/lib/auth/permissions";

/**
 * Admin navigation, declared once with the permission each area needs. The
 * sidebar hides what a role cannot reach; the pages and actions behind them
 * check the same permission again.
 */
export interface AdminNavItem {
  href: string;
  label: string;
  permission: Permission;
  /** Match sub-routes too (e.g. /admin/products/new). */
  prefix?: boolean;
}

export interface AdminNavSection {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavSection[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", permission: "dashboard.view" }],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", permission: "product.read", prefix: true },
      { href: "/admin/categories", label: "Categories", permission: "category.write", prefix: true },
      {
        href: "/admin/collections",
        label: "Collections",
        permission: "collection.write",
        prefix: true,
      },
      { href: "/admin/media", label: "Media", permission: "media.write", prefix: true },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", permission: "order.read", prefix: true },
      { href: "/admin/customers", label: "Customers", permission: "customer.read", prefix: true },
      { href: "/admin/coupons", label: "Coupons", permission: "settings.write", prefix: true },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/journal", label: "Journal", permission: "content.write", prefix: true },
      { href: "/admin/pages", label: "Pages", permission: "content.write", prefix: true },
      { href: "/admin/homepage", label: "Homepage", permission: "content.write", prefix: true },
      { href: "/admin/navigation", label: "Navigation", permission: "content.write", prefix: true },
      { href: "/admin/messages", label: "Enquiries", permission: "customer.read", prefix: true },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", permission: "settings.write", prefix: true },
      { href: "/admin/team", label: "Team", permission: "admin.manage", prefix: true },
      { href: "/admin/audit", label: "Audit log", permission: "audit.read", prefix: true },
    ],
  },
];
