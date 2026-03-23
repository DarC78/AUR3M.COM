import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import Stripe from "stripe";
import { getDbPool } from "../shared/db";
import { markDatePaymentPaid } from "../shared/dateFlow";
import { sendMembershipUpgradeEmail } from "../shared/email";
import { getCurrentTierForMembership, getStripeClient, getStripeWebhookSecret } from "../shared/stripe";
import { updateUserVerificationFromStripeSession } from "../shared/userVerifications";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;
  const paymentType = session.metadata?.paymentType;
  const relationshipId = session.metadata?.relationshipId;

  if (paymentType === "gold_date" && relationshipId && userId) {
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    await markDatePaymentPaid(
      relationshipId,
      userId,
      session.id,
      paymentIntentId
    );
    return;
  }

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
      SET membership = CASE
                         WHEN current_tier < @current_tier THEN @membership
                         ELSE membership
                       END,
          current_tier = CASE
                           WHEN current_tier < @current_tier THEN @current_tier
                           ELSE current_tier
                         END,
          membership_status = @membership_status,
          stripe_subscription_id = COALESCE(@stripe_subscription_id, stripe_subscription_id),
          stripe_customer_id = COALESCE(@stripe_customer_id, stripe_customer_id)
      OUTPUT INSERTED.email
      WHERE id = @id;
    `);

  const updatedUser = updateResult.recordset[0] as { email: string } | undefined;

  if (updatedUser?.email) {
    await sendMembershipUpgradeEmail(updatedUser.email, tier as "silver" | "gold" | "platinum");
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
      SET membership = CASE
                         WHEN current_tier <= 1 THEN @membership
                         ELSE membership
                       END,
          current_tier = CASE
                           WHEN current_tier <= 1 THEN @current_tier
                           ELSE current_tier
                         END,
          membership_status = @membership_status
      WHERE stripe_subscription_id = @stripe_subscription_id;
    `);
}

async function handleIdentityVerificationUpdated(
  session: Stripe.Identity.VerificationSession,
  status: "processing" | "verified" | "requires_input" | "canceled"
): Promise<void> {
  const pool = await getDbPool();
  await updateUserVerificationFromStripeSession(
    pool,
    session.id,
    status,
    {
      last_verification_report: typeof session.last_verification_report === "string"
        ? session.last_verification_report
        : session.last_verification_report?.id ?? null,
      verified_outputs: session.verified_outputs ?? null
    },
    session.last_error?.code ?? null,
    session.last_error?.reason ?? null
  );
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
      case "identity.verification_session.processing":
        await handleIdentityVerificationUpdated(
          event.data.object as Stripe.Identity.VerificationSession,
          "processing"
        );
        break;
      case "identity.verification_session.verified":
        await handleIdentityVerificationUpdated(
          event.data.object as Stripe.Identity.VerificationSession,
          "verified"
        );
        break;
      case "identity.verification_session.requires_input":
        await handleIdentityVerificationUpdated(
          event.data.object as Stripe.Identity.VerificationSession,
          "requires_input"
        );
        break;
      case "identity.verification_session.canceled":
        await handleIdentityVerificationUpdated(
          event.data.object as Stripe.Identity.VerificationSession,
          "canceled"
        );
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
