import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { sendPartnerPassedEmail } from "../shared/email";
import {
  ensureRelationshipForPair,
  getSessionRelationshipContext,
  normalizeRelationshipPair,
  updateRelationshipStage
} from "../shared/speedRoundFollowUp";

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
    const session = await getSessionRelationshipContext(pool, body.session_id, authUserId);

    if (!session) {
      return {
        status: 404,
        jsonBody: {
          error: "Session not found for this user."
        }
      };
    }

    const participantId =
      session.participantAUserId.toLowerCase() === authUserId.toLowerCase()
        ? session.participantAId
        : session.participantBId;

    await ensureRelationshipForPair(pool, session.participantAUserId, session.participantBUserId, body.session_id, "3min");

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

    if (bothDecided) {
      if (mutualYes) {
        const { userAId, userBId } = normalizeRelationshipPair(session.participantAUserId, session.participantBUserId);

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

        if (session.sessionTier === "15min") {
          await updateRelationshipStage(pool, session.relationshipId, "15min", body.session_id);
        } else if (session.sessionTier === "60min") {
          await updateRelationshipStage(pool, session.relationshipId, "60min", body.session_id);
        } else if (session.sessionTier === "date") {
          await updateRelationshipStage(pool, session.relationshipId, "date", body.session_id);
        } else {
          await updateRelationshipStage(pool, session.relationshipId, "3min", body.session_id);
        }
      } else {
        await updateRelationshipStage(pool, session.relationshipId, "passed", body.session_id);

        const yesParticipantIds = new Set(
          decisions
            .filter((item) => item.decision === "yes")
            .map((item) => item.participant_id.toLowerCase())
        );

        if (yesParticipantIds.has(session.participantAId.toLowerCase())) {
          await sendPartnerPassedEmail(session.participantAEmail);
        }

        if (yesParticipantIds.has(session.participantBId.toLowerCase())) {
          await sendPartnerPassedEmail(session.participantBEmail);
        }
      }
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
