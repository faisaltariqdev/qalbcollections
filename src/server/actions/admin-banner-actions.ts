"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ContentActionResult } from "@/lib/admin/content-schema";
import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit";

/** The homepage hero, and any other placed banner. */

const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "The hero needs a headline").max(120),
  eyebrow: z.string().trim().max(60).optional(),
  subtitle: z.string().trim().max(300).optional(),
  imageUrl: z.string().trim().min(1, "Choose an image").max(500),
  imageAlt: z.string().trim().min(4, "Describe the image").max(200),
  ctaLabel: z.string().trim().max(48).optional(),
  ctaHref: z.string().trim().max(300).optional(),
  ctaLabel2: z.string().trim().max(48).optional(),
  ctaHref2: z.string().trim().max(300).optional(),
  placement: z.string().trim().min(2).max(48).default("home_hero"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function saveBanner(input: unknown): Promise<ContentActionResult> {
  try {
    const admin = await requirePermission("content.write");
    const parsed = bannerSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fieldErrors)) fieldErrors[key] = issue.message;
      }
      return { ok: false, message: "Check the highlighted fields.", fieldErrors };
    }

    const { id, ...value } = parsed.data;
    const data = {
      title: value.title,
      eyebrow: nullable(value.eyebrow),
      subtitle: nullable(value.subtitle),
      imageUrl: value.imageUrl,
      imageAlt: value.imageAlt,
      ctaLabel: nullable(value.ctaLabel),
      ctaHref: nullable(value.ctaHref),
      ctaLabel2: nullable(value.ctaLabel2),
      ctaHref2: nullable(value.ctaHref2),
      placement: value.placement,
      sortOrder: value.sortOrder,
      active: value.active,
    };

    const banner = id
      ? await db.banner.update({ where: { id }, data })
      : await db.banner.create({ data });

    await recordAudit({
      actor: admin,
      action: id ? "banner.update" : "banner.create",
      entity: "Banner",
      entityId: banner.id,
      summary: `${banner.placement}: ${banner.title}`,
    });

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { ok: true, message: "Hero saved.", id: banner.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
