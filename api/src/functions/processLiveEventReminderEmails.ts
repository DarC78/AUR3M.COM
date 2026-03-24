import sql from "mssql";
import { app, InvocationContext, Timer } from "@azure/functions";
import { getDbPool } from "../shared/db";
import { enqueueLiveEventReminderEmail } from "../shared/email";
import { syncSpeedRoundEventStatuses } from "../shared/speedRoundEvents";

type LiveEventRow = {
  id: string;
  title: string;
  starts_at: Date;
};

type RecipientRow = {
  id: string;
  email: string;
};

const LOOKAHEAD_LOWER_MINUTES = 55;
const LOOKAHEAD_UPPER_MINUTES = 65;

function buildReminderKey(eventId: string, userId: string): string {
  return `live_evt_${eventId.slice(0, 8)}_${userId.slice(0, 8)}`;
}

async function getUpcomingLiveEvents(): Promise<LiveEventRow[]> {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("lower_minutes", sql.Int, LOOKAHEAD_LOWER_MINUTES)
    .input("upper_minutes", sql.Int, LOOKAHEAD_UPPER_MINUTES)
    .query(`
      SELECT
        id,
        title,
        starts_at
      FROM dbo.speed_round_events
      WHERE event_type = 'live'
        AND status IN ('scheduled', 'live')
        AND starts_at > DATEADD(MINUTE, @lower_minutes, SYSUTCDATETIME())
        AND starts_at <= DATEADD(MINUTE, @upper_minutes, SYSUTCDATETIME())
      ORDER BY starts_at ASC;
    `);

  return result.recordset as LiveEventRow[];
}

async function getReminderRecipients(): Promise<RecipientRow[]> {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT
      id,
      email
    FROM dbo.users
    WHERE membership = 'paid'
      AND is_test_member = 0
      AND is_active = 1;
  `);

  return result.recordset as RecipientRow[];
}

export async function processLiveEventReminderEmails(
  _timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("Live event reminder processor tick.");

  try {
    const pool = await getDbPool();
    await syncSpeedRoundEventStatuses(pool);

    const [events, recipients] = await Promise.all([
      getUpcomingLiveEvents(),
      getReminderRecipients()
    ]);

    if (events.length === 0 || recipients.length === 0) {
      context.log("No live event reminders to enqueue.");
      return;
    }

    let queuedCount = 0;

    for (const event of events) {
      for (const recipient of recipients) {
        await enqueueLiveEventReminderEmail(
          recipient.email,
          event.title,
          new Date(event.starts_at),
          buildReminderKey(event.id, recipient.id)
        );
        queuedCount += 1;
      }
    }

    context.log(`Processed live event reminder candidates: ${queuedCount}.`);
  } catch (error) {
    context.error("Live event reminder processor failed.", error);
  }
}

app.timer("process-live-event-reminder-emails", {
  schedule: "0 */5 * * * *",
  handler: processLiveEventReminderEmails
});
