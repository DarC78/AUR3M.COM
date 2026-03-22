import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import Stripe from "stripe";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { getStripeClient } from "../shared/stripe";

export async function paymentsCancel(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Payment cancel request received.");

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

  try {
    const pool = await getDbPool();
    const userResult = await pool.request()
      .input("id", sql.UniqueIdentifier, auth.sub)
      .query(`
        SELECT stripe_subscription_id
        FROM dbo.users
        WHERE id = @id;
      `);

    const user = userResult.recordset[0] as { stripe_subscription_id: string | null } | undefined;

    if (!user?.stripe_subscription_id) {
      return {
        status: 404,
        jsonBody: {
          error: "No active subscription found."
        }
      };
    }

    const stripe = getStripeClient();
    const subscription = (await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true
    }) as unknown) as Stripe.Subscription & { current_period_end: number };

    return {
      status: 200,
      jsonBody: {
        membership: "silver",
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    };
  } catch (error) {
    context.error("Payment cancel failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown cancel error"
      }
    };
  }
}

app.http("payments-cancel", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "payments/cancel",
  handler: paymentsCancel
});
