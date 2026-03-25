import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { createVideoAccessToken } from "../shared/twilio";
import { getDbPool } from "../shared/db";

type TwilioTokenRequest = {
  room_name?: string;
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

export async function twilioToken(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Twilio token request received.");

  let auth;

  try {
    auth = requireAuth(request);
  } catch (error) {
    return {
      status: 401,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unauthorized"
      }
    };
  }

  let body: TwilioTokenRequest;

  try {
    body = (await request.json()) as TwilioTokenRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.room_name)) {
    return badRequest("room_name is required.");
  }

  try {
    const roomName = body.room_name.trim();
    const pool = await getDbPool();
    const sessionResult = await pool.request()
      .input("room_name", sql.NVarChar(100), roomName)
      .input("user_id", sql.UniqueIdentifier, auth.sub)
      .query(`
        SELECT TOP 1
          s.duration_seconds,
          COALESCE(s.scheduled_at, s.created_at) AS starts_at,
          s.camera_off
        FROM dbo.speed_round_sessions s
        INNER JOIN dbo.speed_round_participants pa
          ON pa.id = s.participant_a_id
        INNER JOIN dbo.speed_round_participants pb
          ON pb.id = s.participant_b_id
        WHERE s.room_name = @room_name
          AND (@user_id = pa.user_id OR @user_id = pb.user_id);
      `);

    const session = sessionResult.recordset[0] as
      | { duration_seconds: number; starts_at: Date; camera_off: boolean }
      | undefined;

    if (!session) {
      return {
        status: 404,
        jsonBody: {
          error: "Room not found for this user."
        }
      };
    }

    const startsAt = new Date(session.starts_at);
    const endsAt = new Date(startsAt.getTime() + (session.duration_seconds * 1000));
    const now = new Date();

    if (now < startsAt) {
      return {
        status: 409,
        jsonBody: {
          error: "This session has not started yet."
        }
      };
    }

    if (now >= endsAt) {
      return {
        status: 409,
        jsonBody: {
          error: "This session has already ended."
        }
      };
    }

    const token = createVideoAccessToken(auth.sub, roomName, session.duration_seconds + 300);

    return {
      status: 200,
      jsonBody: {
        token,
        room_name: roomName,
        camera_off: session.camera_off
      }
    };
  } catch (error) {
    context.error("Twilio token generation failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown Twilio token error"
      }
    };
  }
}

app.http("twilio-token", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "twilio/token",
  handler: twilioToken
});
