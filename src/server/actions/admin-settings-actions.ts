"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DEFAULT_CURRENCY, toMinorUnits } from "@/lib/money";
import { SETTINGS_FIELDS } from "@/lib/settings";
import { recordAudit } from "@/server/audit";

/**
 * Site settings.
 *
 * Only keys declared in `SETTINGS_FIELDS` can be written, so a crafted payload
 * cannot introduce settings the application never reads.
 */

const input = z.object({
  values: z.record(z.string(), z.string().max(2000)),
});

const FIELD_OF = new Map(SETTINGS_FIELDS.map((field) => [field.key as string, field]));

/**
 * Money is entered in major units but stored in minor units, so the storefront
 * never divides at display time. An empty amount stays empty, which is how a
 * threshold is switched off.
 */
function normalise(key: string, raw: string, currency: string) {
  if (FIELD_OF.get(key)?.type !== "money") return raw;
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  return String(toMinorUnits(trimmed, currency));
}

export async function saveSettings(raw: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = await requirePermission("settings.write");
    const parsed = input.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "That request was not valid." };

    const currency = parsed.data.values.currency?.trim() || DEFAULT_CURRENCY;

    const entries = Object.entries(parsed.data.values)
      .filter(([key]) => FIELD_OF.has(key))
      .map(([key, value]) => [key, normalise(key, value, currency)] as const);

    if (entries.length === 0) return { ok: false, message: "Nothing to save." };

    await db.$transaction(
      entries.map(([key, value]) =>
        db.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value, group: FIELD_OF.get(key)?.group ?? "general" },
        }),
      ),
    );

    await recordAudit({
      actor: admin,
      action: "settings.update",
      entity: "SiteSetting",
      summary: entries.map(([key]) => key).join(", ").slice(0, 300),
    });

    // Contact details, shipping copy and flags are read on nearly every page.
    revalidatePath("/", "layout");

    return { ok: true, message: "Settings saved." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
