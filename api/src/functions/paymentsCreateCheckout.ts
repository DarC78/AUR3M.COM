import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import Stripe from "stripe";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { getStripeClient, getTierConfig } from "../shared/stripe";

type CheckoutRequest = {
  tier?: "silver" | "gold" | "platinum";
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

  if (!body.tier || !["silver", "gold", "platinum"].includes(body.tier)) {
    return badRequest("tier must be silver, gold, or platinum.");
  }

  try {
    const stripe = getStripeClient();
    const tierConfig = getTierConfig(body.tier);
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
      mode: tierConfig.mode,
      allow_promotion_codes: true,
      line_items: [{ price: tierConfig.priceId, quantity: 1 }],
      success_url: "https://aur3m.com/dashboard?payment=success",
      cancel_url: "https://aur3m.com/dashboard?payment=cancelled",
      metadata: {
        userId: user.id,
        tier: body.tier
      }
    };

    const session = await stripe.checkout.sessions.create(
      tierConfig.mode === "subscription"
        ? {
            ...sessionConfig,
            payment_method_collection: "if_required"
          }
        : sessionConfig
    );

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
