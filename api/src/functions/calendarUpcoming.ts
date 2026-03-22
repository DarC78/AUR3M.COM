import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

export async function calendarUpcoming(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Calendar upcoming request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return {
      status: 401,
      jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" }
    };
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT
          sc.id,
          sc.session_id,
          CASE
            WHEN sc.user_a_id = @user_id THEN ub.display_name
            ELSE ua.display_name
          END AS partner_alias,
          sc.scheduled_at,
          sc.duration_minutes,
          sc.call_type,
          sc.status,
          sc.room_name
        FROM dbo.scheduled_calls sc
        INNER JOIN dbo.users ua
          ON ua.id = sc.user_a_id
        INNER JOIN dbo.users ub
          ON ub.id = sc.user_b_id
        WHERE (@user_id = sc.user_a_id OR @user_id = sc.user_b_id)
          AND sc.status IN ('scheduled', 'in-progress')
          AND sc.scheduled_at >= DATEADD(HOUR, -1, SYSUTCDATETIME())
        ORDER BY sc.scheduled_at ASC;
      `);

    return {
      status: 200,
      jsonBody: {
        upcoming: result.recordset
      }
    };
  } catch (error) {
    context.error("Calendar upcoming lookup failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown calendar upcoming error" }
    };
  }
}

app.http("calendar-upcoming", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "calendar/upcoming",
  handler: calendarUpcoming
});
