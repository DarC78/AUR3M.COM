import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

type SpeedRoundDecisionRequest = {
  session_id?: string;
  decision?: "yes" | "pass";
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

function normalizeConnectionPair(userA: string, userB: string): { userAId: string; userBId: string } {
  return userA.toLowerCase() < userB.toLowerCase()
    ? { userAId: userA, userBId: userB }
    : { userAId: userB, userBId: userA };
}

export async function speedRoundsDecision(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round decision request received.");

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

  let body: SpeedRoundDecisionRequest;

  try {
    body = (await request.json()) as SpeedRoundDecisionRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.session_id) {
    return badRequest("session_id is required.");
  }

  if (!body.decision || !["yes", "pass"].includes(body.decision)) {
    return badRequest('decision must be "yes" or "pass".');
  }

  try {
    const pool = await getDbPool();
    const sessionResult = await pool.request()
      .input("session_id", sql.UniqueIdentifier, body.session_id)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT TOP 1
          s.id AS session_id,
          s.participant_a_id,
          s.participant_b_id,
          pa.user_id AS participant_a_user_id,
          pb.user_id AS participant_b_user_id
        FROM dbo.speed_round_sessions s
        INNER JOIN dbo.speed_round_participants pa ON pa.id = s.participant_a_id
        INNER JOIN dbo.speed_round_participants pb ON pb.id = s.participant_b_id
        WHERE s.id = @session_id
          AND (@user_id = pa.user_id OR @user_id = pb.user_id);
      `);

    const session = sessionResult.recordset[0] as
      | {
          session_id: string;
          participant_a_id: string;
          participant_b_id: string;
          participant_a_user_id: string;
          participant_b_user_id: string;
        }
      | undefined;

    if (!session) {
      return {
        status: 404,
        jsonBody: {
          error: "Session not found for this user."
        }
      };
    }

    const participantId =
      session.participant_a_user_id.toLowerCase() === authUserId.toLowerCase()
        ? session.participant_a_id
        : session.participant_b_id;

    await pool.request()
      .input("session_id", sql.UniqueIdentifier, body.session_id)
      .input("participant_id", sql.UniqueIdentifier, participantId)
      .input("decision", sql.NVarChar(10), body.decision)
      .query(`
        MERGE dbo.speed_round_decisions AS target
        USING (
          SELECT
            @session_id AS session_id,
            @participant_id AS participant_id,
            @decision AS decision
        ) AS source
        ON target.session_id = source.session_id
           AND target.participant_id = source.participant_id
        WHEN MATCHED THEN
          UPDATE SET
            decision = source.decision,
            updated_at = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (session_id, participant_id, decision)
          VALUES (source.session_id, source.participant_id, source.decision);
      `);

    const decisionsResult = await pool.request()
      .input("session_id", sql.UniqueIdentifier, body.session_id)
      .query(`
        SELECT participant_id, decision
        FROM dbo.speed_round_decisions
        WHERE session_id = @session_id;
      `);

    const decisions = decisionsResult.recordset as Array<{ participant_id: string; decision: "yes" | "pass" }>;
    const bothDecided = decisions.length >= 2;
    const mutualYes = bothDecided && decisions.every((item) => item.decision === "yes");

    if (mutualYes) {
      const { userAId, userBId } = normalizeConnectionPair(session.participant_a_user_id, session.participant_b_user_id);

      await pool.request()
        .input("user_a_id", sql.UniqueIdentifier, userAId)
        .input("user_b_id", sql.UniqueIdentifier, userBId)
        .query(`
          IF NOT EXISTS (
            SELECT 1
            FROM dbo.connections
            WHERE user_a_id = @user_a_id AND user_b_id = @user_b_id
          )
          BEGIN
            INSERT INTO dbo.connections (user_a_id, user_b_id)
            VALUES (@user_a_id, @user_b_id);
          END;
        `);
    }

    return {
      status: 200,
      jsonBody: {
        session_id: body.session_id,
        decision: body.decision,
        both_decided: bothDecided,
        matched: mutualYes
      }
    };
  } catch (error) {
    context.error("Speed round decision failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown speed round decision error"
      }
    };
  }
}

app.http("speed-rounds-decision", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "speed-rounds/decision",
  handler: speedRoundsDecision
});
