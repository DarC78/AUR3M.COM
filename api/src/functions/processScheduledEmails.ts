import { app, InvocationContext, Timer } from "@azure/functions";
import sql from "mssql";
import { sendEmail } from "../shared/email";
import { getDbPool } from "../shared/db";

type ScheduledEmailRecord = {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  html_body: string;
};

const MAX_BATCH_SIZE = 25;
const MAX_ATTEMPTS = 5;
const STALE_PROCESSING_MINUTES = 30;

async function claimDueEmails(): Promise<ScheduledEmailRecord[]> {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("batch_size", sql.Int, MAX_BATCH_SIZE)
    .input("max_attempts", sql.Int, MAX_ATTEMPTS)
    .input("stale_processing_minutes", sql.Int, STALE_PROCESSING_MINUTES)
    .query(`
      ;WITH due_emails AS (
        SELECT TOP (@batch_size)
          id
        FROM dbo.scheduled_emails WITH (UPDLOCK, READPAST, ROWLOCK)
        WHERE to_send_after_date <= SYSUTCDATETIME()
          AND attempts < @max_attempts
          AND (
            status = 'pending'
            OR (
              status = 'processing'
              AND processing_started_at <= DATEADD(MINUTE, -@stale_processing_minutes, SYSUTCDATETIME())
            )
          )
        ORDER BY to_send_after_date, created_at
      )
      UPDATE se
      SET status = 'processing',
          attempts = attempts + 1,
          last_attempt_at = SYSUTCDATETIME(),
          processing_started_at = SYSUTCDATETIME(),
          updated_at = SYSUTCDATETIME(),
          last_error = NULL
      OUTPUT
        INSERTED.id,
        INSERTED.from_email,
        INSERTED.to_email,
        INSERTED.subject,
        INSERTED.html_body
      FROM dbo.scheduled_emails se
      INNER JOIN due_emails d
        ON d.id = se.id;
    `);

  return result.recordset as ScheduledEmailRecord[];
}

async function markEmailSent(id: string): Promise<void> {
  const pool = await getDbPool();
  await pool.request()
    .input("id", sql.UniqueIdentifier, id)
    .query(`
      UPDATE dbo.scheduled_emails
      SET status = 'sent',
          sent_at = SYSUTCDATETIME(),
          processing_started_at = NULL,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id;
    `);
}

async function markEmailFailed(id: string, errorMessage: string): Promise<void> {
  const pool = await getDbPool();
  await pool.request()
    .input("id", sql.UniqueIdentifier, id)
    .input("max_attempts", sql.Int, MAX_ATTEMPTS)
    .input("last_error", sql.NVarChar(2000), errorMessage.slice(0, 2000))
    .query(`
      UPDATE dbo.scheduled_emails
      SET status = CASE WHEN attempts >= @max_attempts THEN 'failed' ELSE 'pending' END,
          processing_started_at = NULL,
          updated_at = SYSUTCDATETIME(),
          last_error = @last_error
      WHERE id = @id;
    `);
}

export async function processScheduledEmails(
  _timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("Scheduled email processor tick.");

  const emails = await claimDueEmails();

  if (emails.length === 0) {
    context.log("No scheduled emails due.");
    return;
  }

  context.log(`Processing ${emails.length} scheduled emails.`);

  for (const email of emails) {
    try {
      await sendEmail(email.from_email, email.to_email, email.subject, email.html_body);
      await markEmailSent(email.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scheduled email error";
      context.error(`Scheduled email ${email.id} failed.`, error);
      await markEmailFailed(email.id, message);
    }
  }
}

app.timer("process-scheduled-emails", {
  schedule: "0 */5 * * * *",
  handler: processScheduledEmails
});
