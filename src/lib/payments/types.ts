import type { PaymentStatus } from "@/lib/constants";

/**
 * Payment abstraction.
 *
 * Checkout and the order service only ever speak to this interface, so adding
 * Stripe, a local Pakistani gateway or a wallet is a new file in `providers/`
 * plus one registry entry — never a change to business logic.
 */

export interface PaymentContext {
  currency: string;
  /** Order total in minor units. */
  amount: number;
  orderNumber: string;
  customerEmail: string;
  returnUrl: string;
}

export type PaymentInitiation =
  | { kind: "settled"; paymentStatus: Extract<PaymentStatus, "PAID"> }
  | { kind: "deferred"; paymentStatus: Extract<PaymentStatus, "UNPAID" | "PENDING">; instructions: string }
  | { kind: "redirect"; paymentStatus: Extract<PaymentStatus, "PENDING">; redirectUrl: string };

export interface PaymentProvider {
  id: string;
  label: string;
  /** Shown under the radio option at checkout. */
  description: string;
  /** Rendered after the order is placed, e.g. bank details. */
  postOrderNote?: string;
  /** Providers can opt out for a currency or amount they cannot handle. */
  supports(context: Pick<PaymentContext, "currency" | "amount">): boolean;
  initiate(context: PaymentContext): Promise<PaymentInitiation>;
}
