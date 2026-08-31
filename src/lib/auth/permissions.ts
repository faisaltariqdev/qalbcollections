import type { AdminRole } from "@/lib/constants";

/**
 * Capability-based authorisation. Views hide what a role cannot do, but every
 * server action re-checks the same matrix — the UI is a convenience, never the
 * control.
 */

export const PERMISSIONS = [
  "dashboard.view",
  "product.read",
  "product.write",
  "product.delete",
  "category.write",
  "collection.write",
  "media.write",
  "order.read",
  "order.write",
  "customer.read",
  "customer.write",
  "content.write",
  "settings.write",
  "admin.manage",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const EDITOR_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "product.read",
  "product.write",
  "category.write",
  "collection.write",
  "media.write",
  "content.write",
];

const ORDER_MANAGER_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "product.read",
  "order.read",
  "order.write",
  "customer.read",
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...EDITOR_PERMISSIONS,
  "product.delete",
  "order.read",
  "order.write",
  "customer.read",
  "customer.write",
  "settings.write",
  "audit.read",
];

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  EDITOR: EDITOR_PERMISSIONS,
  ORDER_MANAGER: ORDER_MANAGER_PERMISSIONS,
};

export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: AdminRole | null | undefined, permissions: readonly Permission[]) {
  return permissions.some((permission) => can(role, permission));
}
