import { z } from "zod";

/**
 * Contact enquiry contract.
 *
 * Lives outside the Server Action module because a `"use server"` file may only
 * export async functions — and because the client form and the server validator
 * must share one schema, not two that drift.
 */

export const CONTACT_SUBJECTS = [
  "General enquiry",
  "About a specific piece",
  "Order status",
  "Returns or exchange",
  "Something else",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .max(32)
    .regex(/^[0-9+()\s-]*$/, "Use digits, spaces and + only")
    .optional()
    .or(z.literal("")),
  subject: z.enum(CONTACT_SUBJECTS).default("General enquiry"),
  message: z
    .string()
    .trim()
    .min(10, "A sentence or two helps us answer properly")
    .max(4000, "Please keep it under 4000 characters"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export interface ContactResult {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ContactInput, string>>;
}
