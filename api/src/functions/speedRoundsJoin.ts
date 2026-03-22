import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

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
          INSERT INTO dbo.speed_round_participants (event_id, user_id)
          VALUES (@event_id, @user_id);
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

    const partnerResult = await pool.request()
      .input("event_id", sql.UniqueIdentifier, body.event_id)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .input("participant_id", sql.UniqueIdentifier, currentParticipant.id)
      .query(`
        SELECT TOP 1 p.id
        FROM dbo.speed_round_participants p
        WHERE p.event_id = @event_id
          AND p.user_id <> @user_id
          AND p.status = 'waiting'
          AND p.id <> @participant_id
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.speed_round_sessions s
            WHERE s.participant_a_id = p.id OR s.participant_b_id = p.id
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

    const partner = partnerResult.recordset[0] as { id: string } | undefined;

    if (!partner) {
      return {
        status: 200,
        jsonBody: {
          matched: false,
          status: "waiting"
        }
      };
    }

    const sessionRoomName = `${event.room_name}-${currentParticipant.id.slice(0, 8)}-${partner.id.slice(0, 8)}`;

    const sessionResult = await pool.request()
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

    const session = sessionResult.recordset[0] as { id: string; room_name: string };

    return {
      status: 200,
      jsonBody: {
        matched: true,
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
