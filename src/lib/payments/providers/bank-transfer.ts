import type { PaymentProvider } from "../types";

export const bankTransfer: PaymentProvider = {
  id: "bank_transfer",
  label: "Bank transfer",
  description: "Transfer the total and share your receipt. We dispatch once payment clears.",
  postOrderNote:
    "Our team will message you the account details for your order. Quote your order number with the transfer.",
  supports: () => true,
  async initiate() {
    return {
      kind: "deferred",
      paymentStatus: "PENDING",
      instructions: "Awaiting bank transfer confirmation.",
    };
  },
};
