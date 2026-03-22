import sql from "mssql";
import { getDbPool } from "./db";
import { enqueueUpcomingCallReminderEmail, sendFollowUpCallScheduledEmail, sendNoCommonAvailabilityEmail } from "./email";
import {
  getScheduledAtForSlot,
  getSessionRelationshipContext,
  updateRelationshipStage
} from "./speedRoundFollowUp";

type MatchSlotsResult =
  | { status: "waiting_for_availability" }
  | { status: "no_common_slots" }
  | { status: "scheduled"; scheduledCallId: string; scheduledAt: string; roomName: string };

function getReminderEmailType(callId: string, suffix: "a" | "b"): string {
  return `rem_${callId}_${suffix}`;
}

export async function cancelScheduledCallReminderEmails(callId: string): Promise<void> {
  const pool = await getDbPool();
  await pool.request()
    .input("reminder_a", sql.NVarChar(50), getReminderEmailType(callId, "a"))
    .input("reminder_b", sql.NVarChar(50), getReminderEmailType(callId, "b"))
    .query(`
      DELETE FROM dbo.scheduled_emails
      WHERE status = 'pending'
        AND email_type IN (@reminder_a, @reminder_b);
    `);
}

async function enqueueScheduledCallReminders(
  callId: string,
  participantAEmail: string,
  participantAAlias: string,
  participantBEmail: string,
  participantBAlias: string,
  scheduledAt: Date
): Promise<void> {
  await enqueueUpcomingCallReminderEmail(
    participantAEmail,
    participantBAlias,
    scheduledAt,
    getReminderEmailType(callId, "a")
  );
  await enqueueUpcomingCallReminderEmail(
    participantBEmail,
    participantAAlias,
    scheduledAt,
    getReminderEmailType(callId, "b")
  );
}

export async function matchSlotsForSession(sessionId: string): Promise<MatchSlotsResult> {
  const pool = await getDbPool();
  const context = await getSessionRelationshipContext(pool, sessionId);

  if (!context) {
    throw new Error("Session relationship context not found.");
  }

  const availabilitySummaryResult = await pool.request()
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .query(`
      SELECT user_id, COUNT(*) AS slot_count
      FROM dbo.speed_round_availability
      WHERE session_id = @session_id
      GROUP BY user_id;
    `);

  const slotCounts = new Map<string, number>();
  for (const row of availabilitySummaryResult.recordset as Array<{ user_id: string; slot_count: number }>) {
    slotCounts.set(row.user_id.toLowerCase(), row.slot_count);
  }

  if (!slotCounts.get(context.participantAUserId.toLowerCase()) || !slotCounts.get(context.participantBUserId.toLowerCase())) {
    return { status: "waiting_for_availability" };
  }

  const existingCallResult = await pool.request()
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .query(`
      SELECT TOP 1 id, scheduled_at, room_name
      FROM dbo.scheduled_calls
      WHERE session_id = @session_id
        AND status IN ('scheduled', 'rescheduled', 'completed')
      ORDER BY created_at DESC;
    `);

  const existingCall = existingCallResult.recordset[0] as
    | { id: string; scheduled_at: string; room_name: string }
    | undefined;

  if (existingCall) {
    return {
      status: "scheduled",
      scheduledCallId: existingCall.id,
      scheduledAt: existingCall.scheduled_at,
      roomName: existingCall.room_name
    };
  }

  const overlapResult = await pool.request()
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .input("user_a_id", sql.UniqueIdentifier, context.participantAUserId)
    .input("user_b_id", sql.UniqueIdentifier, context.participantBUserId)
    .query(`
      SELECT TOP 1
        a.slot_date,
        a.period
      FROM dbo.speed_round_availability a
      INNER JOIN dbo.speed_round_availability b
        ON b.session_id = a.session_id
       AND b.slot_date = a.slot_date
       AND b.period = a.period
      WHERE a.session_id = @session_id
        AND a.user_id = @user_a_id
        AND b.user_id = @user_b_id
      ORDER BY
        a.slot_date ASC,
        CASE a.period
          WHEN 'morning' THEN 1
          WHEN 'afternoon' THEN 2
          ELSE 3
        END ASC;
    `);

  const overlap = overlapResult.recordset[0] as
    | { slot_date: Date; period: "morning" | "afternoon" | "evening" }
    | undefined;

  if (!overlap) {
    await sendNoCommonAvailabilityEmail(context.participantAEmail, context.participantBAlias);
    await sendNoCommonAvailabilityEmail(context.participantBEmail, context.participantAAlias);
    return { status: "no_common_slots" };
  }

  const date = overlap.slot_date.toISOString().slice(0, 10);
  const scheduledAt = getScheduledAtForSlot(date, overlap.period);
  const roomName = `sr-followup-${sessionId.slice(0, 8)}`;

  const scheduledCallResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, context.relationshipId)
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .input("user_a_id", sql.UniqueIdentifier, context.participantAUserId)
    .input("user_b_id", sql.UniqueIdentifier, context.participantBUserId)
    .input("scheduled_at", sql.DateTime2, scheduledAt)
    .input("duration_minutes", sql.Int, 15)
    .input("room_name", sql.NVarChar(100), roomName)
    .query(`
      INSERT INTO dbo.scheduled_calls (
        relationship_id,
        session_id,
        user_a_id,
        user_b_id,
        scheduled_at,
        duration_minutes,
        room_name
      )
      OUTPUT INSERTED.id
      VALUES (
        @relationship_id,
        @session_id,
        @user_a_id,
        @user_b_id,
        @scheduled_at,
        @duration_minutes,
        @room_name
      );
    `);

  const scheduledCallId = (scheduledCallResult.recordset[0] as { id: string }).id;

  await updateRelationshipStage(pool, context.relationshipId, "scheduled_15min", sessionId);
  await sendFollowUpCallScheduledEmail(context.participantAEmail, context.participantBAlias, scheduledAt);
  await sendFollowUpCallScheduledEmail(context.participantBEmail, context.participantAAlias, scheduledAt);
  await enqueueScheduledCallReminders(
    scheduledCallId,
    context.participantAEmail,
    context.participantAAlias,
    context.participantBEmail,
    context.participantBAlias,
    scheduledAt
  );

  return {
    status: "scheduled",
    scheduledCallId,
    scheduledAt: scheduledAt.toISOString(),
    roomName
  };
}
