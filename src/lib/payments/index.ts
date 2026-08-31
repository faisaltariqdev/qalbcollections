import { bankTransfer } from "./providers/bank-transfer";
import { cashOnDelivery } from "./providers/cash-on-delivery";
import type { PaymentContext, PaymentProvider } from "./types";

export type { PaymentContext, PaymentInitiation, PaymentProvider } from "./types";

/** Every implemented provider, whether or not it is switched on. */
const REGISTRY: Record<string, PaymentProvider> = {
  [cashOnDelivery.id]: cashOnDelivery,
  [bankTransfer.id]: bankTransfer,
};

const FALLBACK_PROVIDER_ID = cashOnDelivery.id;

function enabledIds(): string[] {
  const configured = (process.env.PAYMENT_PROVIDERS ?? FALLBACK_PROVIDER_ID)
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id in REGISTRY);

  return configured.length > 0 ? configured : [FALLBACK_PROVIDER_ID];
}

/** Providers enabled by configuration and able to handle this basket. */
export function availablePaymentProviders(
  context: Pick<PaymentContext, "currency" | "amount">,
): PaymentProvider[] {
  return enabledIds()
    .map((id) => REGISTRY[id]!)
    .filter((provider) => provider.supports(context));
}

export function getPaymentProvider(id: string): PaymentProvider | null {
  if (!enabledIds().includes(id)) return null;
  return REGISTRY[id] ?? null;
}

export function paymentProviderLabel(id: string) {
  return REGISTRY[id]?.label ?? id;
}
