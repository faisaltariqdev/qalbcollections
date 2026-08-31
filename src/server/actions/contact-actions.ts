"use server";

import { contactSchema, type ContactInput, type ContactResult } from "@/lib/contact";
import { db } from "@/lib/db";
import { limitByClient } from "@/lib/rate-limit";

/**
 * Contact form submission.
 *
 * Validated and rate limited on the server; nothing the client sends is trusted.
 * Messages land in the database so an admin answers from one place rather than an
 * inbox rule.
 */
export async function submitContactMessage(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: ContactResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as keyof ContactInput] = issue.message;
      }
    }
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }

  const limit = await limitByClient("contact", 4, 15 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Too many messages from this connection. Try again shortly." };
  }

  await db.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });

  return { ok: true, message: "Message received. We reply within one working day." };
}
