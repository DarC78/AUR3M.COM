import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import Stripe from "stripe";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { getStripeClient } from "../shared/stripe";

export async function paymentsStatus(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Payment status request received.");

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
        SELECT membership, membership_status, stripe_subscription_id
        FROM dbo.users
        WHERE id = @id;
      `);

    const user = userResult.recordset[0] as
      | {
          membership: string;
          membership_status: string;
          stripe_subscription_id: string | null;
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

    const coachingResult = await pool.request()
      .input("user_id", sql.UniqueIdentifier, auth.sub)
      .query(`
        SELECT TOP 1 status, paid_at
        FROM dbo.coaching_program_payments
        WHERE user_id = @user_id;
      `);

    const coachingProgram = coachingResult.recordset[0] as
      | {
          status: string;
          paid_at: Date | null;
        }
      | undefined;

    if (user.stripe_subscription_id) {
      const stripe = getStripeClient();
      const subscription = (await stripe.subscriptions.retrieve(user.stripe_subscription_id) as unknown) as Stripe.Subscription & {
        current_period_end: number;
      };

      return {
        status: 200,
        jsonBody: {
          membership: user.membership,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          add_ons: {
            coaching_program: {
              purchased: coachingProgram?.status === "paid",
              status: coachingProgram?.status ?? "not_purchased",
              paid_at: coachingProgram?.paid_at?.toISOString() ?? null
            }
          }
        }
      };
    }

    return {
      status: 200,
      jsonBody: {
        membership: user.membership,
        status: user.membership_status,
        current_period_end: null,
        cancel_at_period_end: false,
        add_ons: {
          coaching_program: {
            purchased: coachingProgram?.status === "paid",
            status: coachingProgram?.status ?? "not_purchased",
            paid_at: coachingProgram?.paid_at?.toISOString() ?? null
          }
        }
      }
    };
  } catch (error) {
    context.error("Payment status lookup failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown payment status error"
      }
    };
  }
}

app.http("payments-status", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "payments/status",
  handler: paymentsStatus
});
