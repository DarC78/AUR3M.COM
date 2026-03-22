import Stripe from "stripe";

type Tier = "silver" | "gold" | "platinum";

export type TierConfig = {
  mode: "subscription" | "payment";
  priceId: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

export function getStripeClient(): Stripe {
  return new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
}

export function getStripeWebhookSecret(): string {
  return getRequiredEnv("STRIPE_WEBHOOK_SECRET");
}

export function getTierConfig(tier: Tier): TierConfig {
  switch (tier) {
    case "silver":
      return {
        mode: "subscription",
        priceId: getRequiredEnv("STRIPE_PRICE_ID_SILVER")
      };
    case "gold":
      return {
        mode: "payment",
        priceId: getRequiredEnv("STRIPE_PRICE_ID_GOLD")
      };
    case "platinum":
      return {
        mode: "payment",
        priceId: getRequiredEnv("STRIPE_PRICE_ID_PLATINUM")
      };
    default:
      throw new Error("Invalid tier.");
  }
}

export function getCurrentTierForMembership(membership: "free" | Tier): number {
  switch (membership) {
    case "free":
      return 0;
    case "silver":
      return 1;
    case "gold":
      return 2;
    case "platinum":
      return 3;
    default:
      throw new Error("Invalid membership tier.");
  }
}

export function getDatePaymentPriceId(): string {
  return getRequiredEnv("STRIPE_PRICE_ID_GOLD_DATE");
}
