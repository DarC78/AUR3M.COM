import { app, InvocationContext, Timer } from "@azure/functions";
import sql from "mssql";
import { getDbPool } from "../shared/db";
import { markDatePaymentRefunded } from "../shared/dateFlow";
import { getStripeClient } from "../shared/stripe";

export async function processDatePaymentRefunds(
  _timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("Date payment refund processor tick.");

  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT dp.relationship_id, dp.user_id, dp.stripe_payment_intent_id
    FROM dbo.date_payments dp
    WHERE dp.status = 'paid'
      AND dp.refund_deadline IS NOT NULL
      AND dp.refund_deadline <= SYSUTCDATETIME()
      AND NOT EXISTS (
        SELECT 1
        FROM dbo.date_payments dp2
        WHERE dp2.relationship_id = dp.relationship_id
          AND dp2.user_id <> dp.user_id
          AND dp2.status = 'paid'
      );
  `);

  const stripe = getStripeClient();
  for (const row of result.recordset as Array<{ relationship_id: string; user_id: string; stripe_payment_intent_id: string | null }>) {
    if (!row.stripe_payment_intent_id) {
      continue;
    }

    try {
      await stripe.refunds.create({ payment_intent: row.stripe_payment_intent_id });
      await markDatePaymentRefunded(row.relationship_id, row.user_id);
    } catch (error) {
      context.error("Date refund failed.", error);
    }
  }
}

app.timer("process-date-payment-refunds", {
  schedule: "0 0 3 * * *",
  handler: processDatePaymentRefunds
});
