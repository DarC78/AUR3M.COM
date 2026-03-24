import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import Stripe from "stripe";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { upsertCoachingProgramCheckoutSession } from "../shared/coachingPrograms";
import { getAddOnConfig, getMembershipTierConfig, getStripeClient } from "../shared/stripe";

type CheckoutRequest = {
  tier?: "paid" | "silver" | "gold" | "platinum";
  add_on?: "coaching_program";
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

export async function paymentsCreateCheckout(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Create checkout request received.");

  let auth;

  try {
    auth = requireAuth(request);
  } catch (error) {
    return {
      status: 401,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unauthorized"
      }
    };
  }

  let body: CheckoutRequest;

  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const requestedTier = body.tier === "silver" ? "paid" : body.tier;
  const requestedAddOn = body.add_on ?? (body.tier === "platinum" ? "coaching_program" : undefined);

  if (requestedTier === "gold") {
    return badRequest("gold is now an offline date add-on. Use the dates/create-payment flow instead.");
  }

  if ((requestedTier ? 1 : 0) + (requestedAddOn ? 1 : 0) !== 1) {
    return badRequest("Provide exactly one of tier=paid or add_on=coaching_program.");
  }

  if (requestedTier && requestedTier !== "paid") {
    return badRequest("tier must be paid.");
  }

  if (requestedAddOn && requestedAddOn !== "coaching_program") {
    return badRequest("add_on must be coaching_program.");
  }

  try {
    const stripe = getStripeClient();
    const productConfig = requestedTier
      ? getMembershipTierConfig(requestedTier)
      : getAddOnConfig(requestedAddOn as "coaching_program");
    const pool = await getDbPool();

    const userResult = await pool.request()
      .input("id", sql.UniqueIdentifier, auth.sub)
      .query(`
        SELECT id, email, stripe_customer_id
        FROM dbo.users
        WHERE id = @id;
      `);

    const user = userResult.recordset[0] as
      | {
          id: string;
          email: string;
          stripe_customer_id: string | null;
        }
      | undefined;

    if (!user) {
      return {
        status: 404,
        jsonBody: {
          error: "User not found."
        }
      };
    }

    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });

      stripeCustomerId = customer.id;

      await pool.request()
        .input("id", sql.UniqueIdentifier, user.id)
        .input("stripe_customer_id", sql.NVarChar(255), stripeCustomerId)
        .query(`
          UPDATE dbo.users
          SET stripe_customer_id = @stripe_customer_id
          WHERE id = @id;
        `);
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: productConfig.mode,
      allow_promotion_codes: true,
      line_items: [{ price: productConfig.priceId, quantity: 1 }],
      success_url: "https://aur3m.com/dashboard?payment=success",
      cancel_url: "https://aur3m.com/dashboard?payment=cancelled",
      metadata: requestedTier
        ? {
            userId: user.id,
            tier: requestedTier
          }
        : {
            userId: user.id,
            paymentType: "coaching_program",
            addOn: "coaching_program"
          }
    };

    const session = await stripe.checkout.sessions.create(
      productConfig.mode === "subscription"
        ? {
            ...sessionConfig,
            payment_method_collection: "if_required"
          }
        : sessionConfig
    );

    if (requestedAddOn === "coaching_program") {
      await upsertCoachingProgramCheckoutSession(user.id, session.id);
    }

    return {
      status: 200,
      jsonBody: {
        url: session.url
      }
    };
  } catch (error) {
    context.error("Create checkout failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown checkout error"
      }
    };
  }
}

app.http("payments-create-checkout", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "payments/create-checkout",
  handler: paymentsCreateCheckout
});
