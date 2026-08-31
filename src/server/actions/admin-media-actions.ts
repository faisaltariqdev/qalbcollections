"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit";

/**
 * Media library maintenance.
 *
 * Alt text lives on the asset so it can be written once and reused wherever the
 * image is placed; a product image may still override it for context.
 */

const altInput = z.object({
  id: z.string().min(1),
  alt: z.string().trim().max(200),
});

export async function updateAssetAlt(input: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    await requirePermission("media.write");
    const parsed = altInput.safeParse(input);
    if (!parsed.success) return { ok: false, message: "That description is too long." };

    await db.mediaAsset.update({
      where: { id: parsed.data.id },
      data: { alt: parsed.data.alt },
    });

    revalidatePath("/admin/media");
    return { ok: true, message: "Description saved." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deleteAsset(id: string): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = await requirePermission("media.write");

    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) return { ok: false, message: "That file no longer exists." };

    // Refuse while anything still points at it, so a live product page cannot
    // end up with a broken image.
    const [productImages, products, categories, collections, posts, banners] = await Promise.all([
      db.productImage.count({ where: { url: asset.url } }),
      db.product.count({ where: { ogImageUrl: asset.url } }),
      db.category.count({ where: { OR: [{ imageUrl: asset.url }, { ogImageUrl: asset.url }] } }),
      db.collection.count({ where: { OR: [{ imageUrl: asset.url }, { ogImageUrl: asset.url }] } }),
      db.blogPost.count({ where: { OR: [{ coverImage: asset.url }, { ogImageUrl: asset.url }] } }),
      db.banner.count({ where: { imageUrl: asset.url } }),
    ]);

    const inUse = productImages + products + categories + collections + posts + banners;
    if (inUse > 0) {
      return {
        ok: false,
        message: `This image is used in ${inUse} place(s). Remove it there first.`,
      };
    }

    await db.mediaAsset.delete({ where: { id } });

    // Only uploads live on disk; anything referenced from /public directly is
    // part of the repository and must stay.
    if (asset.url.startsWith("/media/uploads/")) {
      await unlink(path.join(process.cwd(), "public", asset.url)).catch(() => {
        // Already gone, or never written. The record is what mattered.
      });
    }

    await recordAudit({
      actor: admin,
      action: "media.delete",
      entity: "MediaAsset",
      entityId: id,
      summary: asset.filename,
    });

    revalidatePath("/admin/media");
    return { ok: true, message: "File deleted." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
