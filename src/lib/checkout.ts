import { z } from "zod";

/**
 * Checkout contract, shared by the form and the Server Action.
 *
 * One schema means client-side hints and server-side enforcement cannot drift,
 * and the server never trusts anything the form sends — it revalidates in full.
 */

export const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Other",
] as const;

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter the full name for delivery").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a phone number the courier can reach")
    .max(24)
    .regex(/^[0-9+()\s-]+$/, "Use digits, spaces and + only"),
  line1: z.string().trim().min(6, "Enter the street address").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Select or enter a city").max(80),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().max(16).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  couponCode: z.string().trim().max(32).optional().or(z.literal("")),
  paymentMethod: z.string().trim().min(1, "Choose how you would like to pay").max(40),
  acceptTerms: z.literal(true, {
    message: "Please accept the terms to place the order",
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutInput, string>>;

export type CheckoutResult =
  | { ok: true; orderNumber: string; token: string }
  | { ok: false; message: string; fieldErrors?: CheckoutFieldErrors };
