import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { syncSpeedRoundSessionStatuses } from "../shared/speedRoundSessions";

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

export async function speedRoundsSessionStatus(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round session status request received.");

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

  const eventId = request.query.get("event_id")?.trim();

  if (!eventId) {
    return badRequest("event_id is required.");
  }

  try {
    const pool = await getDbPool();
    await syncSpeedRoundSessionStatuses(pool);
    const participantResult = await pool.request()
      .input("event_id", sql.UniqueIdentifier, eventId)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT TOP 1 id, status, joined_at
        FROM dbo.speed_round_participants
        WHERE event_id = @event_id
          AND user_id = @user_id;
      `);

    const participant = participantResult.recordset[0] as
      | {
          id: string;
          status: string;
          joined_at: string;
        }
      | undefined;

    if (!participant) {
      return {
        status: 200,
        jsonBody: {
          joined: false,
          matched: false,
          status: "not_joined"
        }
      };
    }

    const sessionResult = await pool.request()
      .input("participant_id", sql.UniqueIdentifier, participant.id)
      .query(`
        SELECT TOP 1
          id,
          room_name,
          status
        FROM dbo.speed_round_sessions
        WHERE participant_a_id = @participant_id
           OR participant_b_id = @participant_id
        ORDER BY created_at DESC;
      `);

    const session = sessionResult.recordset[0] as
      | {
          id: string;
          room_name: string;
          status: string;
        }
      | undefined;

    if (session && ["matched", "active"].includes(session.status)) {
      return {
        status: 200,
        jsonBody: {
          joined: true,
          matched: true,
          session_id: session.id,
          room_name: session.room_name
        }
      };
    }

    if (participant.status === "browsing") {
      return {
        status: 200,
        jsonBody: {
          joined: false,
          matched: false,
          status: "browsing"
        }
      };
    }

    return {
      status: 200,
      jsonBody: {
        joined: true,
        matched: false,
        status: participant.status === "matched" ? "waiting" : participant.status
      }
    };
  } catch (error) {
    context.error("Speed round session status lookup failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown speed round session status error"
      }
    };
  }
}

app.http("speed-rounds-session-status", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "speed-rounds/session-status",
  handler: speedRoundsSessionStatus
});
