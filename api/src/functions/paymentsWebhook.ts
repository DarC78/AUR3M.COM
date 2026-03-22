import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import Stripe from "stripe";
import { getDbPool } from "../shared/db";
import { enqueueMembershipUpgradeEmail } from "../shared/email";
import { getCurrentTierForMembership, getStripeClient, getStripeWebhookSecret } from "../shared/stripe";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId || !tier || !["silver", "gold", "platinum"].includes(tier)) {
    return;
  }

  const pool = await getDbPool();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const updateResult = await pool.request()
    .input("id", sql.UniqueIdentifier, userId)
    .input("membership", sql.NVarChar(20), tier)
    .input("current_tier", sql.Int, getCurrentTierForMembership(tier as "silver" | "gold" | "platinum"))
    .input("membership_status", sql.NVarChar(50), "active")
    .input("stripe_subscription_id", sql.NVarChar(255), subscriptionId)
    .input("stripe_customer_id", sql.NVarChar(255), customerId)
    .query(`
      UPDATE dbo.users
      SET membership = @membership,
          current_tier = @current_tier,
          membership_status = @membership_status,
          stripe_subscription_id = COALESCE(@stripe_subscription_id, stripe_subscription_id),
          stripe_customer_id = COALESCE(@stripe_customer_id, stripe_customer_id)
      OUTPUT INSERTED.email
      WHERE id = @id;
    `);

  const updatedUser = updateResult.recordset[0] as { email: string } | undefined;

  if (updatedUser?.email) {
    await enqueueMembershipUpgradeEmail(updatedUser.email, tier as "silver" | "gold" | "platinum");
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const subscriptionId =
    typeof invoiceWithSubscription.subscription === "string"
      ? invoiceWithSubscription.subscription
      : invoiceWithSubscription.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const pool = await getDbPool();
  await pool.request()
    .input("stripe_subscription_id", sql.NVarChar(255), subscriptionId)
    .input("membership_status", sql.NVarChar(50), "active")
    .query(`
      UPDATE dbo.users
      SET membership_status = @membership_status
      WHERE stripe_subscription_id = @stripe_subscription_id;
    `);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const subscriptionId =
    typeof invoiceWithSubscription.subscription === "string"
      ? invoiceWithSubscription.subscription
      : invoiceWithSubscription.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const pool = await getDbPool();
  await pool.request()
    .input("stripe_subscription_id", sql.NVarChar(255), subscriptionId)
    .input("membership_status", sql.NVarChar(50), "past_due")
    .query(`
      UPDATE dbo.users
      SET membership_status = @membership_status
      WHERE stripe_subscription_id = @stripe_subscription_id;
    `);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const pool = await getDbPool();
  await pool.request()
    .input("stripe_subscription_id", sql.NVarChar(255), subscription.id)
    .input("membership", sql.NVarChar(20), "free")
    .input("current_tier", sql.Int, getCurrentTierForMembership("free"))
    .input("membership_status", sql.NVarChar(50), "cancelled")
    .query(`
      UPDATE dbo.users
      SET membership = @membership,
          current_tier = @current_tier,
          membership_status = @membership_status
      WHERE stripe_subscription_id = @stripe_subscription_id;
    `);
}

export async function paymentsWebhook(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Stripe webhook received.");

  try {
    const stripe = getStripeClient();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return {
        status: 400,
        jsonBody: {
          error: "Missing stripe-signature header."
        }
      };
    }

    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        context.log(`Unhandled Stripe event: ${event.type}`);
        break;
    }

    return {
      status: 200,
      jsonBody: {
        received: true
      }
    };
  } catch (error) {
    context.error("Stripe webhook failed.", error);

    return {
      status: 400,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown webhook error"
      }
    };
  }
}

app.http("payments-webhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "payments/webhook",
  handler: paymentsWebhook
});
