import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { ensureRelationshipForPair, getSessionRelationshipContext } from "../shared/speedRoundFollowUp";
import { logUserAction } from "../shared/userActionLogs";

type SpeedRoundsFeedbackRequest = {
  session_id?: string;
  was_professional?: boolean | null;
  felt_unsafe?: boolean | null;
  private_note?: string | null;
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: { error: message }
  };
}

function isNullableBoolean(value: unknown): value is boolean | null | undefined {
  return value === undefined || value === null || typeof value === "boolean";
}

export async function speedRoundsFeedback(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round feedback request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return {
      status: 401,
      jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" }
    };
  }

  let body: SpeedRoundsFeedbackRequest;

  try {
    body = (await request.json()) as SpeedRoundsFeedbackRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.session_id) {
    return badRequest("session_id is required.");
  }

  if (!isNullableBoolean(body.was_professional) || !isNullableBoolean(body.felt_unsafe)) {
    return badRequest("was_professional and felt_unsafe must be boolean or null.");
  }

  const privateNote = typeof body.private_note === "string" ? body.private_note.trim() : null;

  if (privateNote && privateNote.length > 500) {
    return badRequest("private_note must be 500 characters or fewer.");
  }

  try {
    const pool = await getDbPool();
    const session = await getSessionRelationshipContext(pool, body.session_id, authUserId);

    if (!session) {
      return {
        status: 404,
        jsonBody: { error: "Session not found for this user." }
      };
    }

    const relationshipId = session.relationshipId ?? await ensureRelationshipForPair(
      pool,
      session.participantAUserId,
      session.participantBUserId,
      body.session_id,
      "3min"
    );

    await pool.request()
      .input("session_id", sql.UniqueIdentifier, body.session_id)
      .input("relationship_id", sql.UniqueIdentifier, relationshipId)
      .input("author_user_id", sql.UniqueIdentifier, authUserId)
      .input(
        "reviewed_user_id",
        sql.UniqueIdentifier,
        session.participantAUserId.toLowerCase() === authUserId.toLowerCase()
          ? session.participantBUserId
          : session.participantAUserId
      )
      .input("was_professional", sql.Bit, body.was_professional ?? null)
      .input("felt_unsafe", sql.Bit, body.felt_unsafe ?? null)
      .input("private_note", sql.NVarChar(500), privateNote)
      .input("stage", sql.NVarChar(30), session.relationshipStage)
      .query(`
        MERGE dbo.speed_round_feedback AS target
        USING (
          SELECT
            @session_id AS session_id,
            @relationship_id AS relationship_id,
            @author_user_id AS author_user_id,
            @was_professional AS was_professional,
            @felt_unsafe AS felt_unsafe,
            @private_note AS private_note
        ) AS source
        ON target.session_id = source.session_id
           AND target.author_user_id = source.author_user_id
        WHEN MATCHED THEN
          UPDATE SET
            relationship_id = source.relationship_id,
            was_professional = source.was_professional,
            felt_unsafe = source.felt_unsafe,
            private_note = source.private_note,
            flagged_for_review = CASE WHEN source.felt_unsafe = 1 THEN 1 ELSE 0 END,
            updated_at = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (
            session_id,
            relationship_id,
            author_user_id,
            was_professional,
            felt_unsafe,
            private_note,
            flagged_for_review
          )
          VALUES (
            source.session_id,
            source.relationship_id,
            source.author_user_id,
            source.was_professional,
            source.felt_unsafe,
            source.private_note,
            CASE WHEN source.felt_unsafe = 1 THEN 1 ELSE 0 END
          );

        IF @private_note IS NULL OR LEN(@private_note) = 0
        BEGIN
          DELETE FROM dbo.relationship_notes
          WHERE relationship_id = @relationship_id
            AND session_id = @session_id
            AND author_user_id = @author_user_id;
        END
        ELSE
        BEGIN
          MERGE dbo.relationship_notes AS target
          USING (
            SELECT
              @relationship_id AS relationship_id,
              @session_id AS session_id,
              @author_user_id AS author_user_id,
              @stage AS stage,
              @private_note AS note
          ) AS source
          ON target.relationship_id = source.relationship_id
             AND target.session_id = source.session_id
             AND target.author_user_id = source.author_user_id
          WHEN MATCHED THEN
            UPDATE SET
              stage = source.stage,
              note = source.note,
              updated_at = SYSUTCDATETIME()
          WHEN NOT MATCHED THEN
            INSERT (relationship_id, session_id, author_user_id, stage, note)
            VALUES (source.relationship_id, source.session_id, source.author_user_id, source.stage, source.note);
        END;

        IF @felt_unsafe = 1
        BEGIN
          UPDATE dbo.relationships
          SET flagged_for_review = 1,
              last_updated = SYSUTCDATETIME()
          WHERE id = @relationship_id;
        END;

        IF @was_professional = 0
           AND (
             SELECT COUNT(*)
             FROM dbo.speed_round_feedback
             WHERE author_user_id <> @reviewed_user_id
               AND was_professional = 0
               AND relationship_id IN (
                 SELECT id
                 FROM dbo.relationships
                 WHERE user_a_id = @reviewed_user_id
                    OR user_b_id = @reviewed_user_id
               )
           ) >= 3
        BEGIN
          UPDATE dbo.users
          SET flagged_for_review = 1,
              updated_at = SYSUTCDATETIME()
          WHERE id = @reviewed_user_id;
        END;
      `);

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
      actionType: "speed_round_feedback_submitted",
      metadata: {
        was_professional: body.was_professional ?? null,
        felt_unsafe: body.felt_unsafe ?? null,
        private_note_present: Boolean(privateNote),
        relationship_stage: session.relationshipStage
      }
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        session_id: body.session_id
      }
    };
  } catch (error) {
    context.error("Speed round feedback failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown speed round feedback error" }
    };
  }
}

app.http("speed-rounds-feedback", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "speed-rounds/feedback",
  handler: speedRoundsFeedback
});
