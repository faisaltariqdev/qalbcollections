import { describe, expect, it } from "vitest";

import { can, canAny, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import { ADMIN_ROLES } from "@/lib/constants";

/**
 * Authorisation is the one place where a quiet regression is a breach, so the
 * matrix is asserted role by role rather than spot-checked.
 */

describe("role matrix", () => {
  it("gives the super admin everything", () => {
    for (const permission of PERMISSIONS) {
      expect(can("SUPER_ADMIN", permission)).toBe(true);
    }
  });

  it("reserves account management for the super admin", () => {
    expect(can("ADMIN", "admin.manage")).toBe(false);
    expect(can("EDITOR", "admin.manage")).toBe(false);
    expect(can("ORDER_MANAGER", "admin.manage")).toBe(false);
    expect(can("SUPER_ADMIN", "admin.manage")).toBe(true);
  });

  it("lets an editor shape the catalogue but not touch orders, customers or settings", () => {
    expect(can("EDITOR", "product.write")).toBe(true);
    expect(can("EDITOR", "content.write")).toBe(true);
    expect(can("EDITOR", "media.write")).toBe(true);
    expect(can("EDITOR", "product.delete")).toBe(false);
    expect(can("EDITOR", "order.read")).toBe(false);
    expect(can("EDITOR", "customer.read")).toBe(false);
    expect(can("EDITOR", "settings.write")).toBe(false);
    expect(can("EDITOR", "audit.read")).toBe(false);
  });

  it("lets an order manager fulfil orders and read the catalogue, nothing more", () => {
    expect(can("ORDER_MANAGER", "order.write")).toBe(true);
    expect(can("ORDER_MANAGER", "customer.read")).toBe(true);
    expect(can("ORDER_MANAGER", "product.read")).toBe(true);
    expect(can("ORDER_MANAGER", "product.write")).toBe(false);
    expect(can("ORDER_MANAGER", "customer.write")).toBe(false);
    expect(can("ORDER_MANAGER", "content.write")).toBe(false);
    expect(can("ORDER_MANAGER", "settings.write")).toBe(false);
  });

  it("gives every role the dashboard they land on after signing in", () => {
    for (const role of ADMIN_ROLES) {
      expect(can(role, "dashboard.view")).toBe(true);
    }
  });

  it("grants an admin everything except account management", () => {
    const missing = PERMISSIONS.filter((permission) => !can("ADMIN", permission));
    expect(missing).toEqual(["admin.manage"]);
  });
});

describe("can", () => {
  it("denies a missing role instead of failing open", () => {
    expect(can(null, "dashboard.view")).toBe(false);
    expect(can(undefined, "product.read")).toBe(false);
  });
});

describe("canAny", () => {
  it("passes when the role holds one of the permissions", () => {
    expect(canAny("ORDER_MANAGER", ["product.write", "order.write"])).toBe(true);
  });

  it("fails when the role holds none of them", () => {
    expect(canAny("ORDER_MANAGER", ["product.write", "settings.write"])).toBe(false);
    expect(canAny("EDITOR", [])).toBe(false);
  });
});

describe("declared roles", () => {
  it("keeps the permission matrix in step with the list of roles", () => {
    expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual([...ADMIN_ROLES].sort());
  });

  it("never grants a permission that does not exist", () => {
    for (const granted of Object.values(ROLE_PERMISSIONS)) {
      for (const permission of granted) {
        expect(PERMISSIONS).toContain(permission);
      }
    }
  });
});
