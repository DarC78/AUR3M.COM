import sql from "mssql";
import { getDbPool } from "./db";

export async function upsertCoachingProgramCheckoutSession(
  userId: string,
  stripeSessionId: string
): Promise<void> {
  const pool = await getDbPool();

  await pool.request()
    .input("user_id", sql.UniqueIdentifier, userId)
    .input("stripe_session_id", sql.NVarChar(255), stripeSessionId)
    .query(`
      MERGE dbo.coaching_program_payments AS target
      USING (
        SELECT
          @user_id AS user_id,
          @stripe_session_id AS stripe_session_id
      ) AS source
      ON target.user_id = source.user_id
      WHEN MATCHED THEN
        UPDATE SET
          stripe_session_id = source.stripe_session_id,
          updated_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (user_id, stripe_session_id)
        VALUES (source.user_id, source.stripe_session_id);
    `);
}

export async function markCoachingProgramPaid(
  userId: string,
  stripeSessionId: string | null,
  stripePaymentIntentId: string | null
): Promise<void> {
  const pool = await getDbPool();

  await pool.request()
    .input("user_id", sql.UniqueIdentifier, userId)
    .input("stripe_session_id", sql.NVarChar(255), stripeSessionId)
    .input("stripe_payment_intent_id", sql.NVarChar(255), stripePaymentIntentId)
    .query(`
      MERGE dbo.coaching_program_payments AS target
      USING (
        SELECT
          @user_id AS user_id,
          @stripe_session_id AS stripe_session_id,
          @stripe_payment_intent_id AS stripe_payment_intent_id
      ) AS source
      ON target.user_id = source.user_id
      WHEN MATCHED THEN
        UPDATE SET
          stripe_session_id = COALESCE(source.stripe_session_id, target.stripe_session_id),
          stripe_payment_intent_id = COALESCE(source.stripe_payment_intent_id, target.stripe_payment_intent_id),
          status = 'paid',
          paid_at = COALESCE(target.paid_at, SYSUTCDATETIME()),
          updated_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (
          user_id,
          stripe_session_id,
          stripe_payment_intent_id,
          status,
          paid_at
        )
        VALUES (
          source.user_id,
          source.stripe_session_id,
          source.stripe_payment_intent_id,
          'paid',
          SYSUTCDATETIME()
        );
    `);
}
