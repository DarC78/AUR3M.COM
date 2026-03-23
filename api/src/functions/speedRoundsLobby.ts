import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

export async function speedRoundsLobby(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round lobby request received.");

  try {
    requireAuth(request);
  } catch (error) {
    return {
      status: 401,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unauthorized"
      }
    };
  }

  const eventId = request.query.get("event_id")?.trim();

  if (!eventId) {
    return badRequest("event_id is required.");
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("event_id", sql.UniqueIdentifier, eventId)
      .query(`
        SELECT
          u.id,
          u.display_name AS alias,
          u.gender,
          u.age_bracket,
          p.joined_at,
          COUNT(*) OVER () AS total_count
        FROM dbo.speed_round_participants p
        INNER JOIN dbo.users u
          ON u.id = p.user_id
        WHERE p.event_id = @event_id
          AND p.status = 'waiting'
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.speed_round_sessions s
            WHERE s.participant_a_id = p.id
               OR s.participant_b_id = p.id
          )
        ORDER BY p.joined_at ASC;
      `);

    const users = (result.recordset as Array<Record<string, unknown> & { total_count?: number }>)
      .map(({ total_count, ...user }) => user);
    const total = (result.recordset[0] as { total_count?: number } | undefined)?.total_count ?? 0;

    return {
      status: 200,
      jsonBody: {
        users,
        total
      }
    };
  } catch (error) {
    context.error("Speed round lobby lookup failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown speed round lobby error"
      }
    };
  }
}

app.http("speed-rounds-lobby", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "speed-rounds/lobby",
  handler: speedRoundsLobby
});
