/**
 * Derives display variants of the supplied brand mark.
 *
 * The original file is never modified. This produces:
 *   • a trimmed, transparent-ground wordmark for the header and footer
 *   • a square 1200×1200 social card on the brand's own parchment ground
 *   • favicon/apple-touch sizes
 *
 * Run with: node scripts/prepare-brand-assets.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SOURCE = "public/media/brand/qalb-collections-logo.png";
const OUT_DIR = "public/media/brand";

/** Distance in RGB space within which a pixel counts as the paper ground. */
const GROUND_TOLERANCE = 26;

async function readGroundColour(image) {
  const { data, info } = await image
    .clone()
    .extract({ left: 0, top: 0, width: 8, height: 8 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < pixels; i += 1) {
    r += data[i * info.channels];
    g += data[i * info.channels + 1];
    b += data[i * info.channels + 2];
  }
  return {
    r: Math.round(r / pixels),
    g: Math.round(g / pixels),
    b: Math.round(b / pixels),
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const source = sharp(SOURCE);
  const meta = await source.metadata();
  const ground = await readGroundColour(source);
  const groundHex = `#${[ground.r, ground.g, ground.b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;

  console.log(`source: ${meta.width}×${meta.height}`);
  console.log(`brand paper colour: ${groundHex}`);

  // --- transparent wordmark ------------------------------------------------
  const { data, info } = await source
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += info.channels) {
    const distance = Math.hypot(
      pixels[i] - ground.r,
      pixels[i + 1] - ground.g,
      pixels[i + 2] - ground.b,
    );
    if (distance <= GROUND_TOLERANCE) {
      pixels[i + 3] = 0;
    } else if (distance <= GROUND_TOLERANCE * 2) {
      // Feather the antialiased rim so edges stay smooth rather than jagged.
      const ratio = (distance - GROUND_TOLERANCE) / GROUND_TOLERANCE;
      pixels[i + 3] = Math.round(pixels[i + 3] * ratio);
    }
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, "qalb-collections-wordmark.png"));

  // --- social card ---------------------------------------------------------
  await sharp(SOURCE)
    .resize(940, 940, { fit: "contain", background: ground })
    .extend({ top: 130, bottom: 130, left: 130, right: 130, background: ground })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, "qalb-collections-og.png"));

  // --- icons ---------------------------------------------------------------
  for (const size of [180, 512]) {
    await sharp(SOURCE)
      .resize(size, size, { fit: "contain", background: ground })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT_DIR, `icon-${size}.png`));
  }

  console.log("wrote wordmark, social card and icons");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
