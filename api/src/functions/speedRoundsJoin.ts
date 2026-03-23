import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { syncSpeedRoundEventStatuses } from "../shared/speedRoundEvents";
import { syncSpeedRoundSessionStatuses } from "../shared/speedRoundSessions";
import { ensureRelationshipForPair } from "../shared/speedRoundFollowUp";

type JoinSpeedRoundRequest = {
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

export async function speedRoundsJoin(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round join request received.");

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

  let body: JoinSpeedRoundRequest;

  try {
    body = (await request.json()) as JoinSpeedRoundRequest;
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
        SELECT id, room_name, status, starts_at, ends_at
        FROM dbo.speed_round_events
        WHERE id = @event_id;
      `);

    const event = eventResult.recordset[0] as
      | {
          id: string;
          room_name: string;
          status: string;
          starts_at: string;
          ends_at: string;
        }
      | undefined;

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
          error: "This speed round is not open for joining."
        }
      };
    }

    const participantResult = await pool.request()
      .input("event_id", sql.UniqueIdentifier, body.event_id)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.speed_round_participants
          WHERE event_id = @event_id AND user_id = @user_id
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
            'waiting',
            SYSUTCDATETIME()
          );
        END;
        ELSE
        BEGIN
          UPDATE p
          SET p.status = 'waiting',
              p.joined_at = CASE
                              WHEN p.status = 'waiting' THEN p.joined_at
                              ELSE SYSUTCDATETIME()
                            END,
              p.lobby_heartbeat_at = SYSUTCDATETIME()
          FROM dbo.speed_round_participants p
          WHERE p.event_id = @event_id
            AND p.user_id = @user_id
            AND NOT EXISTS (
              SELECT 1
              FROM dbo.speed_round_sessions s
              WHERE (s.participant_a_id = p.id OR s.participant_b_id = p.id)
                AND s.status IN ('matched', 'active')
            );
        END;

        SELECT TOP 1 id, joined_at, status
        FROM dbo.speed_round_participants
        WHERE event_id = @event_id AND user_id = @user_id;
      `);

    const currentParticipant = participantResult.recordset[0] as {
      id: string;
      joined_at: string;
      status: string;
    };

    const existingSessionResult = await pool.request()
      .input("participant_id", sql.UniqueIdentifier, currentParticipant.id)
      .query(`
        SELECT TOP 1
          id,
          room_name,
          status
        FROM dbo.speed_round_sessions
        WHERE participant_a_id = @participant_id OR participant_b_id = @participant_id
        ORDER BY created_at DESC;
      `);

    const existingSession = existingSessionResult.recordset[0] as
      | {
          id: string;
          room_name: string;
          status: string;
        }
      | undefined;

    if (existingSession && ["matched", "active"].includes(existingSession.status)) {
      return {
        status: 200,
        jsonBody: {
          matched: true,
          session_id: existingSession.id,
          room_name: existingSession.room_name
        }
      };
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    let session: { id: string; room_name: string } | undefined;
    let partnerUserId: string | undefined;

    try {
      const lockedCurrentParticipantResult = await new sql.Request(transaction)
        .input("participant_id", sql.UniqueIdentifier, currentParticipant.id)
        .query(`
          SELECT TOP 1 id, user_id
          FROM dbo.speed_round_participants WITH (UPDLOCK, HOLDLOCK)
          WHERE id = @participant_id;
        `);

      const lockedCurrentParticipant = lockedCurrentParticipantResult.recordset[0] as
        | { id: string; user_id: string }
        | undefined;

      if (!lockedCurrentParticipant) {
        throw new Error("Current participant not found.");
      }

      const existingTransactionalSessionResult = await new sql.Request(transaction)
        .input("participant_id", sql.UniqueIdentifier, currentParticipant.id)
        .query(`
          SELECT TOP 1
            id,
            room_name,
            status
          FROM dbo.speed_round_sessions WITH (UPDLOCK, HOLDLOCK)
          WHERE participant_a_id = @participant_id
             OR participant_b_id = @participant_id
          ORDER BY created_at DESC;
        `);

      const existingTransactionalSession = existingTransactionalSessionResult.recordset[0] as
        | { id: string; room_name: string; status: string }
        | undefined;

      if (existingTransactionalSession && ["matched", "active"].includes(existingTransactionalSession.status)) {
        session = existingTransactionalSession;
      } else {
        const partnerResult = await new sql.Request(transaction)
          .input("event_id", sql.UniqueIdentifier, body.event_id)
          .input("user_id", sql.UniqueIdentifier, authUserId)
          .input("participant_id", sql.UniqueIdentifier, currentParticipant.id)
          .query(`
            SELECT TOP 1 p.id, p.user_id
            FROM dbo.speed_round_participants p WITH (UPDLOCK, HOLDLOCK, ROWLOCK)
            INNER JOIN dbo.users AS current_member
              ON current_member.id = @user_id
            INNER JOIN dbo.users AS candidate_member
              ON candidate_member.id = p.user_id
            WHERE p.event_id = @event_id
              AND p.user_id <> @user_id
              AND p.status = 'waiting'
              AND p.id <> @participant_id
              AND (
                current_member.interested_in = 'both'
                OR (current_member.interested_in = 'women' AND candidate_member.gender = 'female')
                OR (current_member.interested_in = 'men' AND candidate_member.gender = 'male')
              )
              AND (
                candidate_member.interested_in = 'both'
                OR (candidate_member.interested_in = 'women' AND current_member.gender = 'female')
                OR (candidate_member.interested_in = 'men' AND current_member.gender = 'male')
              )
              AND NOT EXISTS (
                SELECT 1
                FROM dbo.speed_round_sessions s WITH (UPDLOCK, HOLDLOCK)
                WHERE (s.participant_a_id = p.id OR s.participant_b_id = p.id)
                  AND s.status IN ('matched', 'active')
              )
              AND (
                LOWER(current_member.email) LIKE '%ionpopescu%'
                OR LOWER(candidate_member.email) LIKE '%ionpopescu%'
                OR NOT EXISTS (
                  SELECT 1
                  FROM dbo.relationships r WITH (UPDLOCK, HOLDLOCK)
                  WHERE r.user_a_id = CASE WHEN @user_id < p.user_id THEN @user_id ELSE p.user_id END
                    AND r.user_b_id = CASE WHEN @user_id < p.user_id THEN p.user_id ELSE @user_id END
                )
              )
            ORDER BY
              CASE
                WHEN EXISTS (
                  SELECT 1
                  FROM dbo.thumbs_up t1
                  WHERE t1.from_user_id = @user_id
                    AND t1.to_user_id = p.user_id
                ) AND EXISTS (
                  SELECT 1
                  FROM dbo.thumbs_up t2
                  WHERE t2.from_user_id = p.user_id
                    AND t2.to_user_id = @user_id
                ) THEN 0
                WHEN EXISTS (
                  SELECT 1
                  FROM dbo.thumbs_up t3
                  WHERE t3.from_user_id = @user_id
                    AND t3.to_user_id = p.user_id
                ) OR EXISTS (
                  SELECT 1
                  FROM dbo.thumbs_up t4
                  WHERE t4.from_user_id = p.user_id
                    AND t4.to_user_id = @user_id
                ) THEN 1
                ELSE 2
              END ASC,
              p.joined_at ASC;
          `);

        const partner = partnerResult.recordset[0] as { id: string; user_id: string } | undefined;

        if (partner) {
          partnerUserId = partner.user_id;

          const participantIds = [currentParticipant.id.slice(0, 8), partner.id.slice(0, 8)].sort();
          const sessionRoomName = `${event.room_name}-${participantIds[0]}-${participantIds[1]}-${Date.now()}`;

          const sessionResult = await new sql.Request(transaction)
            .input("event_id", sql.UniqueIdentifier, body.event_id)
            .input("participant_a_id", sql.UniqueIdentifier, currentParticipant.id)
            .input("participant_b_id", sql.UniqueIdentifier, partner.id)
            .input("room_name", sql.NVarChar(100), sessionRoomName)
            .query(`
              INSERT INTO dbo.speed_round_sessions (
                event_id,
                participant_a_id,
                participant_b_id,
                room_name
              )
              OUTPUT INSERTED.id, INSERTED.room_name
              VALUES (
                @event_id,
                @participant_a_id,
                @participant_b_id,
                @room_name
              );

              UPDATE dbo.speed_round_participants
              SET status = 'matched'
              WHERE id IN (@participant_a_id, @participant_b_id);
            `);

          session = sessionResult.recordset[0] as { id: string; room_name: string };
        }
      }

      await transaction.commit();
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

    if (!session) {
      return {
        status: 200,
        jsonBody: {
          matched: false,
          status: "waiting"
        }
      };
    }

    if (partnerUserId) {
      await ensureRelationshipForPair(pool, authUserId, partnerUserId, session.id, "3min");
    }

    return {
      status: 200,
      jsonBody: {
        matched: true,
        status: "matched",
        session_id: session.id,
        room_name: session.room_name
      }
    };
  } catch (error) {
    context.error("Speed round join failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown speed round join error"
      }
    };
  }
}

app.http("speed-rounds-join", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "speed-rounds/join",
  handler: speedRoundsJoin
});
