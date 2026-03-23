import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

type CompleteSessionRequest = {
  session_id?: string;
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

export async function speedRoundsCompleteSession(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round complete session request received.");

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

  let body: CompleteSessionRequest;

  try {
    body = (await request.json()) as CompleteSessionRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.session_id) {
    return badRequest("session_id is required.");
  }

  try {
    const pool = await getDbPool();
    const sessionResult = await pool.request()
      .input("session_id", sql.UniqueIdentifier, body.session_id)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT TOP 1
          s.id,
          s.status,
          s.participant_a_id,
          s.participant_b_id
        FROM dbo.speed_round_sessions s
        INNER JOIN dbo.speed_round_participants pa
          ON pa.id = s.participant_a_id
        INNER JOIN dbo.speed_round_participants pb
          ON pb.id = s.participant_b_id
        WHERE s.id = @session_id
          AND (@user_id = pa.user_id OR @user_id = pb.user_id);
      `);

    const session = sessionResult.recordset[0] as
      | { id: string; status: string; participant_a_id: string; participant_b_id: string }
      | undefined;

    if (!session) {
      return {
        status: 404,
        jsonBody: {
          error: "Session not found for this user."
        }
      };
    }

    await pool.request()
      .input("session_id", sql.UniqueIdentifier, body.session_id)
      .input("participant_a_id", sql.UniqueIdentifier, session.participant_a_id)
      .input("participant_b_id", sql.UniqueIdentifier, session.participant_b_id)
      .query(`
        UPDATE dbo.speed_round_sessions
        SET status = CASE WHEN status = 'cancelled' THEN status ELSE 'completed' END,
            completed_at = CASE WHEN status = 'cancelled' THEN completed_at ELSE COALESCE(completed_at, SYSUTCDATETIME()) END
        WHERE id = @session_id;

        UPDATE dbo.speed_round_participants
        SET status = 'completed'
        WHERE id IN (@participant_a_id, @participant_b_id)
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.speed_round_sessions s
            WHERE (s.participant_a_id = dbo.speed_round_participants.id OR s.participant_b_id = dbo.speed_round_participants.id)
              AND s.status IN ('matched', 'active')
          );
      `);

    return {
      status: 200,
      jsonBody: {
        success: true,
        session_id: body.session_id
      }
    };
  } catch (error) {
    context.error("Speed round complete session failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown speed round complete session error"
      }
    };
  }
}

app.http("speed-rounds-complete-session", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "speed-rounds/complete-session",
  handler: speedRoundsCompleteSession
});
