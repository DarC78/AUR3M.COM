import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { sendPartnerPassedEmail } from "../shared/email";
import {
  ensureRelationshipForPair,
  getSessionRelationshipContext,
  updateRelationshipStage
} from "../shared/speedRoundFollowUp";
import { logUserAction } from "../shared/userActionLogs";

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

    const relationshipId = session.relationshipId ?? await ensureRelationshipForPair(
      pool,
      session.participantAUserId,
      session.participantBUserId,
      body.session_id,
      "3min"
    );

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
        await pool.request()
          .input("user_a_id", sql.UniqueIdentifier, session.participantAUserId)
          .input("user_b_id", sql.UniqueIdentifier, session.participantBUserId)
          .query(`
            IF NOT EXISTS (
              SELECT 1
              FROM dbo.connections
              WHERE user_a_id = CASE WHEN @user_a_id < @user_b_id THEN @user_a_id ELSE @user_b_id END
                AND user_b_id = CASE WHEN @user_a_id < @user_b_id THEN @user_b_id ELSE @user_a_id END
            )
            BEGIN
              INSERT INTO dbo.connections (user_a_id, user_b_id)
              VALUES (
                CASE WHEN @user_a_id < @user_b_id THEN @user_a_id ELSE @user_b_id END,
                CASE WHEN @user_a_id < @user_b_id THEN @user_b_id ELSE @user_a_id END
              );
            END;
          `);

        if (session.sessionTier === "15min") {
          await updateRelationshipStage(pool, relationshipId, "15min", body.session_id);
        } else if (session.sessionTier === "60min") {
          await updateRelationshipStage(pool, relationshipId, "60min", body.session_id);
        } else if (session.sessionTier === "date") {
          await updateRelationshipStage(pool, relationshipId, "date", body.session_id);
        } else {
          await updateRelationshipStage(pool, relationshipId, "3min", body.session_id);
        }
      } else {
        await pool.request()
          .input("user_a_id", sql.UniqueIdentifier, session.participantAUserId)
          .input("user_b_id", sql.UniqueIdentifier, session.participantBUserId)
          .query(`
            DELETE FROM dbo.connections
            WHERE user_a_id = CASE WHEN @user_a_id < @user_b_id THEN @user_a_id ELSE @user_b_id END
              AND user_b_id = CASE WHEN @user_a_id < @user_b_id THEN @user_b_id ELSE @user_a_id END;
          `);

        await updateRelationshipStage(pool, relationshipId, "passed", body.session_id);

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

    await logUserAction(pool, {
      actorUserId: authUserId,
      targetUserId:
        session.participantAUserId.toLowerCase() === authUserId.toLowerCase()
          ? session.participantBUserId
          : session.participantAUserId,
      sessionId: body.session_id,
      relationshipId,
      entityType: "speed_round_session",
      entityId: body.session_id,
      actionType: "speed_round_decision_submitted",
      metadata: {
        decision: body.decision,
        session_tier: session.sessionTier,
        both_decided: bothDecided,
        mutual_yes: mutualYes
      }
    });

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
