import Stripe from "stripe";

export type MembershipTier = "paid";
export type AddOnType = "coaching_program";

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

export function getPublicAppUrl(): string {
  return getRequiredEnv("PUBLIC_APP_URL");
}

export function getStripeWebhookSecret(): string {
  return getRequiredEnv("STRIPE_WEBHOOK_SECRET");
}

function getFirstDefinedEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing one of the required environment variables: ${names.join(", ")}`);
}

export function getMembershipTierConfig(tier: MembershipTier): TierConfig {
  switch (tier) {
    case "paid":
      return {
        mode: "subscription",
        priceId: getFirstDefinedEnv(["STRIPE_PRICE_ID_PAID", "STRIPE_PRICE_ID_SILVER"])
      };
    default:
      throw new Error("Invalid membership tier.");
  }
}

export function getAddOnConfig(addOn: AddOnType): TierConfig {
  switch (addOn) {
    case "coaching_program":
      return {
        mode: "payment",
        priceId: getFirstDefinedEnv(["STRIPE_PRICE_ID_COACHING_PROGRAM", "STRIPE_PRICE_ID_PLATINUM"])
      };
    default:
      throw new Error("Invalid add-on.");
  }
}

export function getCurrentTierForMembership(membership: "free" | MembershipTier): number {
  switch (membership) {
    case "free":
      return 0;
    case "paid":
      return 1;
    default:
      throw new Error("Invalid membership tier.");
  }
}

export function getDatePaymentPriceId(): string {
  return getFirstDefinedEnv(["STRIPE_PRICE_ID_OFFLINE_DATE", "STRIPE_PRICE_ID_GOLD_DATE"]);
}
