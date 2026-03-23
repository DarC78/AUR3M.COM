import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

type LeaveLobbyRequest = {
  event_id?: string;
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function speedRoundsLeaveLobby(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round leave lobby request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return {
      status: 401,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unauthorized"
      }
    };
  }

  let body: LeaveLobbyRequest;

  try {
    body = (await request.json()) as LeaveLobbyRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.event_id)) {
    return badRequest("event_id is required.");
  }

  try {
    const pool = await getDbPool();

    await pool.request()
      .input("event_id", sql.UniqueIdentifier, body.event_id)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        UPDATE p
        SET p.status = CASE
                         WHEN EXISTS (
                           SELECT 1
                           FROM dbo.speed_round_sessions s
                           WHERE (s.participant_a_id = p.id OR s.participant_b_id = p.id)
                             AND s.status IN ('matched', 'active')
                         ) THEN p.status
                         ELSE 'left'
                       END,
            p.lobby_heartbeat_at = CASE
                                     WHEN EXISTS (
                                       SELECT 1
                                       FROM dbo.speed_round_sessions s
                                       WHERE (s.participant_a_id = p.id OR s.participant_b_id = p.id)
                                         AND s.status IN ('matched', 'active')
                                     ) THEN p.lobby_heartbeat_at
                                     ELSE NULL
                                   END
        FROM dbo.speed_round_participants p
        WHERE p.event_id = @event_id
          AND p.user_id = @user_id;
      `);

    return {
      status: 200,
      jsonBody: {
        success: true
      }
    };
  } catch (error) {
    context.error("Speed round leave lobby failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown speed round leave lobby error"
      }
    };
  }
}

app.http("speed-rounds-leave-lobby", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "speed-rounds/leave-lobby",
  handler: speedRoundsLeaveLobby
});
