"use server";

import { z } from "zod";

import { db } from "@/lib/db";
import { limitByClient } from "@/lib/rate-limit";

/** Email capture for the newsletter and the perfume launch list. */

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  source: z.string().max(64).default("footer"),
});

export interface SubscribeResult {
  ok: boolean;
  message: string;
}

export async function subscribeToNewsletter(
  input: z.input<typeof schema>,
): Promise<SubscribeResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const limit = await limitByClient("newsletter", 5, 10 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email, source: parsed.data.source },
  });

  // The same confirmation either way — never disclose whether an address is
  // already on the list.
  return { ok: true, message: "You're on the list. We'll be in touch." };
}

const notifySchema = schema.extend({ topic: z.string().min(1).max(64).default("perfumes") });

export async function requestLaunchNotification(
  input: z.input<typeof notifySchema>,
): Promise<SubscribeResult> {
  const parsed = notifySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const limit = await limitByClient("notify", 5, 10 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  await db.notifyRequest.upsert({
    where: { email_topic: { email: parsed.data.email, topic: parsed.data.topic } },
    update: {},
    create: { email: parsed.data.email, topic: parsed.data.topic },
  });

  return { ok: true, message: "Noted. You'll hear from us first." };
}
