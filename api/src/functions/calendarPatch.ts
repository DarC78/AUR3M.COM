import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { cancelScheduledCallReminderEmails } from "../shared/followUpScheduling";
import { enqueueUpcomingCallReminderEmail } from "../shared/email";
import { AvailabilityPeriod, getScheduledAtForSlot } from "../shared/speedRoundFollowUp";

type CalendarPatchRequest = {
  action?: "reschedule" | "cancel";
  new_date?: string;
  new_period?: AvailabilityPeriod;
};

const allowedPeriods = new Set<AvailabilityPeriod>(["morning", "afternoon", "evening"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: { error: message }
  };
}

export async function calendarPatch(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Calendar patch request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return {
      status: 401,
      jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" }
    };
  }

  const callId = request.params.id;
  if (!callId) {
    return badRequest("id is required.");
  }

  let body: CalendarPatchRequest;

  try {
    body = (await request.json()) as CalendarPatchRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.action || !["reschedule", "cancel"].includes(body.action)) {
    return badRequest('action must be "reschedule" or "cancel".');
  }

  if (body.action === "reschedule") {
    if (!body.new_date || !isoDatePattern.test(body.new_date)) {
      return badRequest("new_date must be an ISO date string.");
    }

    if (!body.new_period || !allowedPeriods.has(body.new_period)) {
      return badRequest('new_period must be "morning", "afternoon", or "evening".');
    }
  }

  try {
    const pool = await getDbPool();
    const callResult = await pool.request()
      .input("id", sql.UniqueIdentifier, callId)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT TOP 1
          sc.id,
          sc.session_id,
          sc.user_a_id,
          sc.user_b_id,
          sc.status,
          ua.email AS user_a_email,
          ub.email AS user_b_email,
          ua.display_name AS user_a_alias,
          ub.display_name AS user_b_alias
        FROM dbo.scheduled_calls sc
        INNER JOIN dbo.users ua
          ON ua.id = sc.user_a_id
        INNER JOIN dbo.users ub
          ON ub.id = sc.user_b_id
        WHERE sc.id = @id
          AND (@user_id = sc.user_a_id OR @user_id = sc.user_b_id);
      `);

    const call = callResult.recordset[0] as
      | {
          id: string;
          session_id: string;
          user_a_id: string;
          user_b_id: string;
          status: string;
          user_a_email: string;
          user_b_email: string;
          user_a_alias: string;
          user_b_alias: string;
        }
      | undefined;

    if (!call) {
      return {
        status: 404,
        jsonBody: { error: "Scheduled call not found for this user." }
      };
    }

    if (body.action === "cancel") {
      await cancelScheduledCallReminderEmails(call.id);
      await pool.request()
        .input("id", sql.UniqueIdentifier, call.id)
        .query(`
          UPDATE dbo.scheduled_calls
          SET status = 'cancelled',
              cancelled_at = SYSUTCDATETIME(),
              updated_at = SYSUTCDATETIME()
          WHERE id = @id;
        `);

      return {
        status: 200,
        jsonBody: {
          success: true,
          id: call.id,
          status: "cancelled"
        }
      };
    }

    const overlapResult = await pool.request()
      .input("session_id", sql.UniqueIdentifier, call.session_id)
      .input("user_a_id", sql.UniqueIdentifier, call.user_a_id)
      .input("user_b_id", sql.UniqueIdentifier, call.user_b_id)
      .input("slot_date", sql.Date, body.new_date!)
      .input("period", sql.NVarChar(20), body.new_period!)
      .query(`
        SELECT TOP 1 1 AS has_overlap
        FROM dbo.speed_round_availability a
        INNER JOIN dbo.speed_round_availability b
          ON b.session_id = a.session_id
         AND b.slot_date = a.slot_date
         AND b.period = a.period
        WHERE a.session_id = @session_id
          AND a.user_id = @user_a_id
          AND b.user_id = @user_b_id
          AND a.slot_date = @slot_date
          AND a.period = @period;
      `);

    if (!overlapResult.recordset[0]) {
      return {
        status: 409,
        jsonBody: { error: "The requested slot is not available for both users." }
      };
    }

    const scheduledAt = getScheduledAtForSlot(body.new_date!, body.new_period!);

    await cancelScheduledCallReminderEmails(call.id);
    await pool.request()
      .input("id", sql.UniqueIdentifier, call.id)
      .input("scheduled_at", sql.DateTime2, scheduledAt)
      .query(`
        UPDATE dbo.scheduled_calls
        SET scheduled_at = @scheduled_at,
            status = 'rescheduled',
            updated_at = SYSUTCDATETIME()
        WHERE id = @id;
      `);

    await enqueueUpcomingCallReminderEmail(call.user_a_email, call.user_b_alias, scheduledAt, `rem_${call.id}_a`);
    await enqueueUpcomingCallReminderEmail(call.user_b_email, call.user_a_alias, scheduledAt, `rem_${call.id}_b`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        id: call.id,
        status: "rescheduled"
      }
    };
  } catch (error) {
    context.error("Calendar patch failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown calendar patch error" }
    };
  }
}

app.http("calendar-patch", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "calendar/{id}",
  handler: calendarPatch
});
