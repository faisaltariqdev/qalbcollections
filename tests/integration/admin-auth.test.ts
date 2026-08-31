import { describe, expect, it } from "vitest";

import { signInAdmin } from "@/server/actions/admin-auth-actions";
import { COOKIES } from "@/lib/constants";
import { getAdminIdentity } from "@/lib/auth/session";
import { db } from "@/lib/db";

import { createAdmin, PASSWORD } from "./factories";
import { __getCookie, __setCookie } from "./stubs/next-headers";

/**
 * Admin sign-in, end to end: real password hashing, a real session row and the
 * real cookie the middleware looks for.
 */

describe("signInAdmin", () => {
  it("signs a valid administrator in and issues a session", async () => {
    const admin = await createAdmin("ADMIN");

    const result = await signInAdmin({ email: admin.email, password: PASSWORD });

    expect(result.ok).toBe(true);
    expect(__getCookie(COOKIES.adminSession)).toBeTruthy();
    await expect(getAdminIdentity()).resolves.toMatchObject({
      email: admin.email,
      role: "ADMIN",
    });
  });

  it("stores only a hash of the session token, never the token itself", async () => {
    const admin = await createAdmin("ADMIN");
    await signInAdmin({ email: admin.email, password: PASSWORD });

    const token = __getCookie(COOKIES.adminSession)!;
    const sessions = await db.session.findMany();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).not.toBe(token);
    expect(sessions[0].tokenHash).toHaveLength(64);
    expect(sessions[0].adminUserId).toBe(admin.id);
  });

  it("records the sign-in and stamps the last login", async () => {
    const admin = await createAdmin("ADMIN");
    await signInAdmin({ email: admin.email, password: PASSWORD });

    const [log] = await db.auditLog.findMany({ where: { action: "admin.sign_in" } });
    expect(log?.adminUserId).toBe(admin.id);

    const refreshed = await db.adminUser.findUnique({ where: { id: admin.id } });
    expect(refreshed?.lastLoginAt).toBeInstanceOf(Date);
  });

  it("rejects a wrong password without saying which half was wrong", async () => {
    const admin = await createAdmin("ADMIN");

    const result = await signInAdmin({ email: admin.email, password: "not-the-password" });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Those credentials are not valid.");
    expect(await db.session.count()).toBe(0);
  });

  it("gives an unknown email the same answer as a wrong password", async () => {
    const unknown = await signInAdmin({ email: "nobody@qalb.test", password: PASSWORD });
    expect(unknown.message).toBe("Those credentials are not valid.");
    expect(await db.auditLog.count({ where: { action: "admin.sign_in_failed" } })).toBe(1);
  });

  it("refuses a deactivated administrator who still knows the password", async () => {
    const admin = await createAdmin("ADMIN", { active: false });

    const result = await signInAdmin({ email: admin.email, password: PASSWORD });

    expect(result.ok).toBe(false);
    expect(await db.session.count()).toBe(0);
  });

  it("stops guessing after five attempts from the same client", async () => {
    const admin = await createAdmin("ADMIN");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await signInAdmin({ email: admin.email, password: "wrong" });
    }

    const blocked = await signInAdmin({ email: admin.email, password: PASSWORD });
    expect(blocked.ok).toBe(false);
    expect(blocked.message).toContain("Too many attempts");
  });
});

describe("getAdminIdentity", () => {
  it("returns nobody without a cookie", async () => {
    await expect(getAdminIdentity()).resolves.toBeNull();
  });

  it("ignores a forged token", async () => {
    await createAdmin("SUPER_ADMIN");
    __setCookie(COOKIES.adminSession, "made-up-token");
    await expect(getAdminIdentity()).resolves.toBeNull();
  });

  it("ignores an expired session", async () => {
    const admin = await createAdmin("ADMIN");
    await signInAdmin({ email: admin.email, password: PASSWORD });

    await db.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    await expect(getAdminIdentity()).resolves.toBeNull();
  });

  it("drops an administrator the moment the account is deactivated", async () => {
    const admin = await createAdmin("ADMIN");
    await signInAdmin({ email: admin.email, password: PASSWORD });

    await db.adminUser.update({ where: { id: admin.id }, data: { active: false } });

    await expect(getAdminIdentity()).resolves.toBeNull();
  });
});
