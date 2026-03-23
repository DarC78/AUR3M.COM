import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { SPEED_ROUND_BACKEND_VERSION } from "../shared/speedRoundBuildInfo";
import { syncSpeedRoundEventStatuses } from "../shared/speedRoundEvents";
import { syncSpeedRoundSessionStatuses } from "../shared/speedRoundSessions";

type EnterLobbyRequest = {
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

export async function speedRoundsEnterLobby(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Speed round enter lobby request received. version=${SPEED_ROUND_BACKEND_VERSION}`);

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

  let body: EnterLobbyRequest;

  try {
    body = (await request.json()) as EnterLobbyRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.event_id)) {
    return badRequest("event_id is required.");
  }

  try {
    const pool = await getDbPool();
    await syncSpeedRoundEventStatuses(pool);
    await syncSpeedRoundSessionStatuses(pool);

    const eventResult = await pool.request()
      .input("event_id", sql.UniqueIdentifier, body.event_id)
      .query(`
        SELECT id, status
        FROM dbo.speed_round_events
        WHERE id = @event_id;
      `);

    const event = eventResult.recordset[0] as { id: string; status: string } | undefined;

    if (!event) {
      return {
        status: 404,
        jsonBody: {
          error: "Speed round event not found."
        }
      };
    }

    if (!["scheduled", "live"].includes(event.status)) {
      return {
        status: 409,
        jsonBody: {
          error: "This speed round is not open for lobby entry."
        }
      };
    }

    await pool.request()
      .input("event_id", sql.UniqueIdentifier, body.event_id)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.speed_round_participants
          WHERE event_id = @event_id
            AND user_id = @user_id
        )
        BEGIN
          INSERT INTO dbo.speed_round_participants (
            event_id,
            user_id,
            status,
            lobby_heartbeat_at
          )
          VALUES (
            @event_id,
            @user_id,
            'browsing',
            SYSUTCDATETIME()
          );
        END;
        ELSE
        BEGIN
          UPDATE p
          SET p.status = CASE
                           WHEN p.status = 'waiting' THEN 'waiting'
                           WHEN EXISTS (
                             SELECT 1
                             FROM dbo.speed_round_sessions s
                             WHERE (s.participant_a_id = p.id OR s.participant_b_id = p.id)
                               AND s.status IN ('matched', 'active')
                           ) THEN p.status
                           ELSE 'browsing'
                         END,
              p.joined_at = CASE
                              WHEN p.status IN ('waiting', 'matched')
                                   OR EXISTS (
                                     SELECT 1
                                     FROM dbo.speed_round_sessions s
                                     WHERE (s.participant_a_id = p.id OR s.participant_b_id = p.id)
                                       AND s.status IN ('matched', 'active')
                                   ) THEN p.joined_at
                              ELSE SYSUTCDATETIME()
                            END,
              p.lobby_heartbeat_at = SYSUTCDATETIME()
          FROM dbo.speed_round_participants p
          WHERE p.event_id = @event_id
            AND p.user_id = @user_id;
        END;
      `);

    return {
      status: 200,
      headers: {
        "x-aur3m-speed-rounds-version": SPEED_ROUND_BACKEND_VERSION
      },
      jsonBody: {
        success: true,
        debug_version: SPEED_ROUND_BACKEND_VERSION
      }
    };
  } catch (error) {
    context.error("Speed round enter lobby failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown speed round enter lobby error"
      }
    };
  }
}

app.http("speed-rounds-enter-lobby", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "speed-rounds/enter-lobby",
  handler: speedRoundsEnterLobby
});
