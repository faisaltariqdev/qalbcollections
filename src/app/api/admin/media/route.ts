import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";

import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";
import { recordAudit } from "@/server/audit";

/**
 * Media library.
 *
 * Uploads are written to `public/media/uploads` and recorded in the database so
 * the picker has one source of truth. Product photography is stored as supplied:
 * only dimensions are read, never re-encoded, because detail is the selling
 * asset. `next/image` handles delivery-time AVIF/WebP conversion.
 */

const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const UPLOAD_DIR = path.join(process.cwd(), "public", "media", "uploads");

export async function GET(request: NextRequest) {
  try {
    await requirePermission("media.write");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    throw error;
  }

  const folder = request.nextUrl.searchParams.get("folder");

  const assets = await db.mediaAsset.findMany({
    where: folder ? { folder } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(assets, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    await assertSameOrigin();
    const admin = await requirePermission("media.write");

    const form = await request.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") ?? "").trim();
    const folder = slugify(String(form.get("folder") ?? "products")) || "products";

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file received." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: "That file is larger than 12 MB." }, { status: 413 });
    }

    const extension = ALLOWED.get(file.type);
    if (!extension) {
      return NextResponse.json(
        { message: "Upload a JPEG, PNG, WebP or AVIF image." },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Decode headers to confirm it really is an image, and to record dimensions
    // so the storefront can reserve space and avoid layout shift.
    let width: number | null = null;
    let height: number | null = null;
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
      if (!width || !height) throw new Error("Unreadable image");
    } catch {
      return NextResponse.json({ message: "That file is not a readable image." }, { status: 415 });
    }

    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "asset";
    const filename = `${base}-${randomBytes(4).toString("hex")}.${extension}`;

    await mkdir(path.join(UPLOAD_DIR, folder), { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, folder, filename), buffer);

    const url = `/media/uploads/${folder}/${filename}`;

    const asset = await db.mediaAsset.create({
      data: {
        url,
        filename,
        alt: alt.slice(0, 200),
        mimeType: file.type,
        sizeBytes: file.size,
        width,
        height,
        folder,
        uploadedBy: admin.id,
      },
    });

    await recordAudit({
      actor: admin,
      action: "media.upload",
      entity: "MediaAsset",
      entityId: asset.id,
      summary: `${filename} (${Math.round(file.size / 1024)} KB)`,
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    throw error;
  }
}
