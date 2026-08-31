import type { PaymentProvider } from "../types";

export const cashOnDelivery: PaymentProvider = {
  id: "cod",
  label: "Cash on delivery",
  description: "Pay the courier when your piece arrives. Available across Pakistan.",
  postOrderNote:
    "Please have the exact amount ready. Our courier will confirm your address by phone before dispatch.",
  supports: ({ currency }) => currency === "PKR",
  async initiate() {
    return {
      kind: "deferred",
      paymentStatus: "UNPAID",
      instructions: "Payment will be collected on delivery.",
    };
  },
};
