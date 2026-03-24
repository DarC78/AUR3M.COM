import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

type SpeedRoundEventType = "test" | "live";

function parseEventType(request: HttpRequest): SpeedRoundEventType {
  const value = request.query.get("event_type")?.trim().toLowerCase();

  if (value === "live") {
    return "live";
  }

  return "test";
}

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
    const eventType = parseEventType(request);
    const result = await pool.request()
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT
          upcoming.id,
          upcoming.session_id,
          upcoming.partner_alias,
          upcoming.scheduled_at,
          upcoming.duration_minutes,
          upcoming.call_type,
          upcoming.status,
          upcoming.room_name,
          upcoming.title,
          upcoming.event_type
        FROM (
          SELECT
            sc.id,
            sc.session_id,
            CASE
              WHEN sc.user_a_id = @user_id THEN ub.display_name
              ELSE ua.display_name
            END AS partner_alias,
            sc.scheduled_at,
            sc.duration_minutes,
            'follow_up' AS call_type,
            CASE
              WHEN sc.status = 'missed' THEN 'cancelled'
              WHEN sc.status = 'in-progress' THEN 'scheduled'
              ELSE sc.status
            END AS status,
            sc.room_name,
            CAST(NULL AS NVARCHAR(150)) AS title,
            CAST(NULL AS NVARCHAR(20)) AS event_type,
            0 AS sort_group
          FROM dbo.scheduled_calls sc
          INNER JOIN dbo.users ua
            ON ua.id = sc.user_a_id
          INNER JOIN dbo.users ub
            ON ub.id = sc.user_b_id
          WHERE (@user_id = sc.user_a_id OR @user_id = sc.user_b_id)
            AND sc.call_type IN ('15min', '60min')
            AND sc.status IN ('scheduled', 'in-progress', 'completed', 'cancelled', 'missed')
            AND sc.scheduled_at >= DATEADD(HOUR, -1, SYSUTCDATETIME())

          UNION ALL

          SELECT
            e.id,
            CAST(NULL AS UNIQUEIDENTIFIER) AS session_id,
            CAST(NULL AS NVARCHAR(150)) AS partner_alias,
            e.starts_at AS scheduled_at,
            DATEDIFF(MINUTE, e.starts_at, e.ends_at) AS duration_minutes,
            'speed_round' AS call_type,
            e.status,
            e.room_name,
            e.title,
            e.event_type,
            1 AS sort_group
          FROM dbo.speed_round_events e
          WHERE e.ends_at > SYSUTCDATETIME()
            AND e.status IN ('scheduled', 'live')
            AND ${eventType === "live"
              ? "e.event_type = 'live'"
              : "e.event_type IN ('test', 'live')"}
        ) AS upcoming
        ORDER BY upcoming.sort_group ASC, upcoming.scheduled_at ASC;
      `);

    return {
      status: 200,
      jsonBody: {
        event_type: eventType,
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
