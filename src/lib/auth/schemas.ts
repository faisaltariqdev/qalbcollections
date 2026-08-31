import { z } from "zod";

import { passwordSchema } from "./password";

/**
 * Auth form contracts, shared by the client forms and the Server Actions.
 *
 * Kept out of the action modules because `"use server"` files may only export
 * async functions — and so the browser and the server validate identically.
 */

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const signInSchema = z.object({
  email,
  // Deliberately loose: the strength rules apply when setting a password, not
  // when checking one, so an old password can still be used to sign in.
  password: z.string().min(1, "Enter your password").max(200),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(120),
  email,
  phone: z
    .string()
    .trim()
    .max(24)
    .regex(/^[0-9+()\s-]*$/, "Use digits, spaces and + only")
    .optional()
    .or(z.literal("")),
  password: passwordSchema,
  marketingOptIn: z.boolean().default(false),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(120),
  phone: z
    .string()
    .trim()
    .max(24)
    .regex(/^[0-9+()\s-]*$/, "Use digits, spaces and + only")
    .optional()
    .or(z.literal("")),
  marketingOptIn: z.boolean().default(false),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").max(200),
  newPassword: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface AuthActionResult<Fields extends string = string> {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<Fields, string>>;
}
