import sql from "mssql";
import { getDbPool } from "./db";
import { enqueueUpcomingCallReminderEmail, sendFollowUpCallScheduledEmail, sendNoCommonAvailabilityEmail } from "./email";
import { getBusyIntervalsForUsers, usersAreAvailableForInterval } from "./schedulingConflicts";
import { convertLocalSlotToUtc } from "./timezones";
import {
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

  const nextTier = context.sessionTier === "3min" ? "15min" : context.sessionTier === "15min" ? "60min" : "date";
  const durationMinutes = nextTier === "15min" ? 15 : nextTier === "60min" ? 60 : 120;

  const existingCallResult = await pool.request()
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .input("next_tier", sql.NVarChar(10), nextTier)
    .query(`
      SELECT TOP 1
        sc.id,
        sc.scheduled_at,
        sc.room_name,
        child.id AS follow_up_session_id
      FROM dbo.scheduled_calls sc
      INNER JOIN dbo.speed_round_sessions child
        ON child.id = sc.session_id
      WHERE child.parent_session_id = @session_id
        AND child.session_tier = @next_tier
        AND sc.status IN ('scheduled', 'rescheduled', 'completed')
      ORDER BY sc.created_at DESC;
    `);

  const existingCall = existingCallResult.recordset[0] as
    | { id: string; scheduled_at: string; room_name: string; follow_up_session_id: string }
    | undefined;

  if (existingCall) {
    return {
      status: "scheduled",
      scheduledCallId: existingCall.id,
      scheduledAt: existingCall.scheduled_at,
      roomName: existingCall.room_name
    };
  }

  const existingFollowUpSessionResult = await pool.request()
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .input("next_tier", sql.NVarChar(10), nextTier)
    .query(`
      SELECT TOP 1 id, scheduled_at, room_name
      FROM dbo.speed_round_sessions
      WHERE parent_session_id = @session_id
        AND session_tier = @next_tier
      ORDER BY created_at DESC;
    `);

  const existingFollowUpSession = existingFollowUpSessionResult.recordset[0] as
    | { id: string; scheduled_at: string | null; room_name: string }
    | undefined;

  const overlapResult = await pool.request()
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .input("user_a_id", sql.UniqueIdentifier, context.participantAUserId)
    .input("user_b_id", sql.UniqueIdentifier, context.participantBUserId)
    .query(`
      SELECT
        a.slot_date AS slot_date_a,
        a.period AS period_a,
        ua.timezone AS timezone_a,
        b.slot_date AS slot_date_b,
        b.period AS period_b,
        ub.timezone AS timezone_b
      FROM dbo.speed_round_availability a
      INNER JOIN dbo.users ua
        ON ua.id = a.user_id
      CROSS JOIN (
        dbo.speed_round_availability b
        INNER JOIN dbo.users ub
          ON ub.id = b.user_id
      )
      WHERE a.session_id = @session_id
        AND b.session_id = @session_id
        AND a.user_id = @user_a_id
        AND b.user_id = @user_b_id
        AND a.slot_date BETWEEN DATEADD(DAY, -1, b.slot_date) AND DATEADD(DAY, 1, b.slot_date);
    `);

  const overlappingSlots = (overlapResult.recordset as Array<{
    slot_date_a: Date;
    period_a: "morning" | "afternoon" | "evening";
    timezone_a: string;
    slot_date_b: Date;
    period_b: "morning" | "afternoon" | "evening";
    timezone_b: string;
  }>)
    .map((row) => ({
      scheduledAtA: convertLocalSlotToUtc(row.slot_date_a.toISOString().slice(0, 10), row.period_a, row.timezone_a),
      scheduledAtB: convertLocalSlotToUtc(row.slot_date_b.toISOString().slice(0, 10), row.period_b, row.timezone_b)
    }))
    .filter((row) => row.scheduledAtA.getTime() === row.scheduledAtB.getTime())
    .sort((left, right) => left.scheduledAtA.getTime() - right.scheduledAtA.getTime());

  const earliestCandidate = overlappingSlots[0];

  if (!earliestCandidate) {
    await sendNoCommonAvailabilityEmail(context.participantAEmail, context.participantBAlias);
    await sendNoCommonAvailabilityEmail(context.participantBEmail, context.participantAAlias);
    return { status: "no_common_slots" };
  }

  const latestCandidate = overlappingSlots[overlappingSlots.length - 1];
  const busyIntervals = await getBusyIntervalsForUsers(
    pool,
    [context.participantAUserId, context.participantBUserId],
    earliestCandidate.scheduledAtA,
    latestCandidate.scheduledAtA
  );

  const overlap = overlappingSlots.find((candidate) => usersAreAvailableForInterval(
    [context.participantAUserId, context.participantBUserId],
    candidate.scheduledAtA,
    durationMinutes,
    busyIntervals
  ));

  if (!overlap) {
    await sendNoCommonAvailabilityEmail(context.participantAEmail, context.participantBAlias);
    await sendNoCommonAvailabilityEmail(context.participantBEmail, context.participantAAlias);
    return { status: "no_common_slots" };
  }

  let scheduledAt = overlap.scheduledAtA;
  let roomName = `sr-followup-${sessionId.slice(0, 8)}-${nextTier}`;
  let followUpSessionId: string;

  if (existingFollowUpSession) {
    followUpSessionId = existingFollowUpSession.id;
    roomName = existingFollowUpSession.room_name;
    await pool.request()
      .input("session_id", sql.UniqueIdentifier, followUpSessionId)
      .input("scheduled_at", sql.DateTime2, scheduledAt)
      .query(`
        UPDATE dbo.speed_round_sessions
        SET scheduled_at = @scheduled_at
        WHERE id = @session_id;
      `);
  } else {
    const followUpSessionResult = await pool.request()
      .input("event_id", sql.UniqueIdentifier, null)
      .input("participant_a_id", sql.UniqueIdentifier, context.participantAId)
      .input("participant_b_id", sql.UniqueIdentifier, context.participantBId)
      .input("room_name", sql.NVarChar(100), roomName)
      .input("status", sql.NVarChar(20), "matched")
      .input("session_tier", sql.NVarChar(10), nextTier)
      .input("duration_seconds", sql.Int, durationMinutes * 60)
      .input("scheduled_at", sql.DateTime2, scheduledAt)
      .input("parent_session_id", sql.UniqueIdentifier, sessionId)
      .query(`
        INSERT INTO dbo.speed_round_sessions (
          event_id,
          participant_a_id,
          participant_b_id,
          room_name,
          status,
          session_tier,
          duration_seconds,
          scheduled_at,
          parent_session_id
        )
        OUTPUT INSERTED.id
        VALUES (
          @event_id,
          @participant_a_id,
          @participant_b_id,
          @room_name,
          @status,
          @session_tier,
          @duration_seconds,
          @scheduled_at,
          @parent_session_id
        );
      `);

    followUpSessionId = (followUpSessionResult.recordset[0] as { id: string }).id;
  }

  const scheduledCallResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, context.relationshipId)
    .input("session_id", sql.UniqueIdentifier, followUpSessionId)
    .input("user_a_id", sql.UniqueIdentifier, context.participantAUserId)
    .input("user_b_id", sql.UniqueIdentifier, context.participantBUserId)
    .input("scheduled_at", sql.DateTime2, scheduledAt)
    .input("duration_minutes", sql.Int, durationMinutes)
    .input("call_type", sql.NVarChar(20), nextTier)
    .input("room_name", sql.NVarChar(100), roomName)
    .query(`
      INSERT INTO dbo.scheduled_calls (
        relationship_id,
        session_id,
        user_a_id,
        user_b_id,
        scheduled_at,
        duration_minutes,
        call_type,
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
        @call_type,
        @room_name
      );
    `);

  const scheduledCallId = (scheduledCallResult.recordset[0] as { id: string }).id;

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
