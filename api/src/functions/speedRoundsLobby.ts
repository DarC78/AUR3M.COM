import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { SPEED_ROUND_BACKEND_VERSION } from "../shared/speedRoundBuildInfo";
import { syncSpeedRoundSessionStatuses } from "../shared/speedRoundSessions";

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
  context.log(`Speed round lobby request received. version=${SPEED_ROUND_BACKEND_VERSION}`);

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
    await syncSpeedRoundSessionStatuses(pool);
    const result = await pool.request()
      .input("event_id", sql.UniqueIdentifier, eventId)
      .query(`
        SELECT
          u.id,
          u.display_name AS alias,
          u.gender,
          u.age_bracket,
          p.joined_at,
          CASE
            WHEN p.status = 'waiting' THEN 'waiting'
            ELSE 'browsing'
          END AS list_type
        FROM dbo.speed_round_participants p
        INNER JOIN dbo.users u
          ON u.id = p.user_id
        WHERE p.event_id = @event_id
          AND (
            p.status = 'waiting'
            OR (p.status <> 'waiting' AND p.lobby_heartbeat_at IS NOT NULL)
          )
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.speed_round_sessions s
            WHERE (s.participant_a_id = p.id OR s.participant_b_id = p.id)
              AND s.status IN ('matched', 'active')
          )
        ORDER BY
          CASE WHEN p.status = 'browsing' THEN 0 ELSE 1 END ASC,
          p.joined_at ASC;
      `);

    const rows = result.recordset as Array<Record<string, unknown> & { list_type: string }>;
    const lobbyUsers = rows
      .filter((row) => row.list_type === "browsing")
      .map(({ list_type, ...user }) => user);
    const matchingUsers = rows
      .filter((row) => row.list_type === "waiting")
      .map(({ list_type, ...user }) => user);

    return {
      status: 200,
      headers: {
        "x-aur3m-speed-rounds-version": SPEED_ROUND_BACKEND_VERSION
      },
      jsonBody: {
        lobby_users: lobbyUsers,
        matching_users: matchingUsers,
        total_lobby: lobbyUsers.length,
        total_matching: matchingUsers.length,
        debug_version: SPEED_ROUND_BACKEND_VERSION
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
