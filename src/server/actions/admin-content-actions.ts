"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  journalSchema,
  pageSchema,
  type ContentActionResult,
} from "@/lib/admin/content-schema";
import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit";

/**
 * Editorial content: journal posts, static pages, homepage sections, navigation
 * and announcements. Everything here is content an editor changes routinely, so
 * none of it should ever need a deploy.
 */

function fieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function saveJournalPost(
  input: unknown,
  postId?: string,
): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const parsed = journalSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error.issues),
      };
    }

    const value = parsed.data;
    const clash = await db.blogPost.findFirst({
      where: { slug: value.slug, id: postId ? { not: postId } : undefined },
      select: { id: true },
    });
    if (clash) {
      return { ok: false, message: "That slug is taken.", fieldErrors: { slug: "Already in use" } };
    }

    const existing = postId
      ? await db.blogPost.findUnique({ where: { id: postId }, select: { publishedAt: true } })
      : null;

    const data = {
      title: value.title,
      slug: value.slug,
      excerpt: value.excerpt,
      body: value.body,
      category: value.category,
      coverImage: nullable(value.coverImage),
      coverAlt: nullable(value.coverAlt),
      authorName: value.authorName,
      readMinutes: value.readMinutes,
      status: value.status,
      featured: value.featured,
      // Stamped once, the first time it goes live, so the public date is stable
      // across later edits.
      publishedAt:
        value.status === "ACTIVE" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt,
      seoTitle: nullable(value.seoTitle),
      seoDescription: nullable(value.seoDescription),
      canonicalUrl: nullable(value.canonicalUrl),
      ogImageUrl: nullable(value.ogImageUrl),
      socialTitle: nullable(value.socialTitle),
      socialDescription: nullable(value.socialDescription),
      noIndex: value.noIndex,
    };

    const post = postId
      ? await db.blogPost.update({ where: { id: postId }, data })
      : await db.blogPost.create({ data });

    await recordAudit({
      actor: admin,
      action: postId ? "journal.update" : "journal.create",
      entity: "BlogPost",
      entityId: post.id,
      summary: `${post.title} (${post.status})`,
    });

    revalidatePath("/journal");
    revalidatePath(`/journal/${post.slug}`);
    revalidatePath("/admin/journal");

    return { ok: true, message: postId ? "Post saved." : "Post created.", id: post.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deleteJournalPost(postId: string): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const post = await db.blogPost.findUnique({
      where: { id: postId },
      select: { title: true, slug: true },
    });
    if (!post) return { ok: false, message: "That post no longer exists." };

    await db.blogPost.delete({ where: { id: postId } });
    await recordAudit({
      actor: admin,
      action: "journal.delete",
      entity: "BlogPost",
      entityId: postId,
      summary: post.title,
    });

    revalidatePath("/journal");
    revalidatePath("/admin/journal");
    return { ok: true, message: "Post deleted." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function savePage(input: unknown, pageId?: string): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const parsed = pageSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error.issues),
      };
    }

    const value = parsed.data;
    const clash = await db.page.findFirst({
      where: { slug: value.slug, id: pageId ? { not: pageId } : undefined },
      select: { id: true },
    });
    if (clash) {
      return { ok: false, message: "That slug is taken.", fieldErrors: { slug: "Already in use" } };
    }

    const data = {
      title: value.title,
      slug: value.slug,
      body: value.body,
      status: value.status,
      seoTitle: nullable(value.seoTitle),
      seoDescription: nullable(value.seoDescription),
      canonicalUrl: nullable(value.canonicalUrl),
      noIndex: value.noIndex,
    };

    const page = pageId
      ? await db.page.update({ where: { id: pageId }, data })
      : await db.page.create({ data });

    await recordAudit({
      actor: admin,
      action: pageId ? "page.update" : "page.create",
      entity: "Page",
      entityId: page.id,
      summary: page.title,
    });

    revalidatePath(`/${page.slug}`);
    revalidatePath("/admin/pages");

    return { ok: true, message: pageId ? "Page saved." : "Page created.", id: page.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deletePage(pageId: string): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const page = await db.page.findUnique({ where: { id: pageId }, select: { title: true, slug: true } });
    if (!page) return { ok: false, message: "That page no longer exists." };

    await db.page.delete({ where: { id: pageId } });
    await recordAudit({
      actor: admin,
      action: "page.delete",
      entity: "Page",
      entityId: pageId,
      summary: page.title,
    });

    revalidatePath(`/${page.slug}`);
    revalidatePath("/admin/pages");
    return { ok: true, message: "Page deleted." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

const sectionInput = z.object({
  id: z.string().min(1),
  eyebrow: z.string().trim().max(60).optional(),
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().max(1200).optional(),
  ctaLabel: z.string().trim().max(48).optional(),
  ctaHref: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  enabled: z.boolean(),
});

/** Reorder, retitle or switch off a homepage section. */
export async function saveHomeSection(input: unknown): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const parsed = sectionInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error.issues),
      };
    }

    const { id, ...rest } = parsed.data;
    const section = await db.homeSection.update({
      where: { id },
      data: {
        eyebrow: nullable(rest.eyebrow),
        title: nullable(rest.title),
        body: nullable(rest.body),
        ctaLabel: nullable(rest.ctaLabel),
        ctaHref: nullable(rest.ctaHref),
        sortOrder: rest.sortOrder,
        enabled: rest.enabled,
      },
    });

    await recordAudit({
      actor: admin,
      action: "homepage.update",
      entity: "HomeSection",
      entityId: section.id,
      summary: `${section.key} (${section.enabled ? "on" : "off"})`,
    });

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { ok: true, message: "Section saved." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

const navInput = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Give the link a label").max(48),
  href: z.string().trim().min(1, "Where should it go?").max(300),
  location: z.enum(["header", "footer"]),
  groupName: z.string().trim().max(48).optional(),
  badge: z.string().trim().max(24).optional(),
  parentId: z.string().trim().max(60).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
});

export async function saveNavItem(input: unknown): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const parsed = navInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error.issues),
      };
    }

    const { id, parentId, ...rest } = parsed.data;
    const data = {
      ...rest,
      groupName: nullable(rest.groupName),
      badge: nullable(rest.badge),
      // A link cannot be its own parent; that would make the tree unrenderable.
      parentId: parentId && parentId !== id ? parentId : null,
    };

    const item = id
      ? await db.navItem.update({ where: { id }, data })
      : await db.navItem.create({ data });

    await recordAudit({
      actor: admin,
      action: id ? "navigation.update" : "navigation.create",
      entity: "NavItem",
      entityId: item.id,
      summary: `${item.location}: ${item.label}`,
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { ok: true, message: "Link saved.", id: item.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deleteNavItem(id: string): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const item = await db.navItem.findUnique({
      where: { id },
      select: { label: true, location: true },
    });
    if (!item) return { ok: false, message: "That link no longer exists." };

    await db.navItem.delete({ where: { id } });
    await recordAudit({
      actor: admin,
      action: "navigation.delete",
      entity: "NavItem",
      entityId: id,
      summary: `${item.location}: ${item.label}`,
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { ok: true, message: "Link removed." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

const announcementInput = z.object({
  id: z.string().optional(),
  message: z.string().trim().min(4, "What should the bar say?").max(160),
  href: z.string().trim().max(300).optional(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export async function saveAnnouncement(input: unknown): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const parsed = announcementInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error.issues),
      };
    }

    const { id, ...rest } = parsed.data;
    const data = { ...rest, href: nullable(rest.href) };

    const announcement = id
      ? await db.announcement.update({ where: { id }, data })
      : await db.announcement.create({ data });

    await recordAudit({
      actor: admin,
      action: id ? "announcement.update" : "announcement.create",
      entity: "Announcement",
      entityId: announcement.id,
      summary: announcement.message,
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { ok: true, message: "Announcement saved.", id: announcement.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deleteAnnouncement(id: string): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    await db.announcement.delete({ where: { id } }).catch(() => null);
    await recordAudit({
      actor: admin,
      action: "announcement.delete",
      entity: "Announcement",
      entityId: id,
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { ok: true, message: "Announcement removed." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
