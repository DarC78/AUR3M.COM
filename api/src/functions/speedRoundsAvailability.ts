import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { matchSlotsForSession } from "../shared/followUpScheduling";
import { AvailabilityPeriod, ensureRelationshipForPair, getSessionRelationshipContext } from "../shared/speedRoundFollowUp";

type AvailabilitySlot = {
  date: string;
  period: AvailabilityPeriod;
};

type SpeedRoundsAvailabilityRequest = {
  session_id?: string;
  slots?: AvailabilitySlot[];
};

const allowedPeriods = new Set<AvailabilityPeriod>(["morning", "afternoon", "evening"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: { error: message }
  };
}

function isWithinNext21Days(dateValue: string): boolean {
  if (!isoDatePattern.test(dateValue)) {
    return false;
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const slotUtc = Date.parse(`${dateValue}T00:00:00.000Z`);

  if (Number.isNaN(slotUtc)) {
    return false;
  }

  const diffDays = Math.floor((slotUtc - todayUtc) / (24 * 60 * 60 * 1000));
  return diffDays >= 0 && diffDays <= 21;
}

export async function speedRoundsAvailability(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round availability request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return {
      status: 401,
      jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" }
    };
  }

  let body: SpeedRoundsAvailabilityRequest;

  try {
    body = (await request.json()) as SpeedRoundsAvailabilityRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.session_id) {
    return badRequest("session_id is required.");
  }

  if (!Array.isArray(body.slots)) {
    return badRequest("slots must be an array.");
  }

  for (const slot of body.slots) {
    if (!slot || !isoDatePattern.test(slot.date) || !allowedPeriods.has(slot.period)) {
      return badRequest('Each slot must include a valid "date" and period of morning, afternoon, or evening.');
    }

    if (!isWithinNext21Days(slot.date)) {
      return badRequest("Each slot date must be within the next 21 days.");
    }
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

    const participantId =
      session.participantAUserId.toLowerCase() === authUserId.toLowerCase()
        ? session.participantAId
        : session.participantBId;

    const decisionResult = await pool.request()
      .input("session_id", sql.UniqueIdentifier, body.session_id)
      .input("participant_id", sql.UniqueIdentifier, participantId)
      .query(`
        SELECT TOP 1 decision
        FROM dbo.speed_round_decisions
        WHERE session_id = @session_id
          AND participant_id = @participant_id;
      `);

    const decision = decisionResult.recordset[0] as { decision: "yes" | "pass" } | undefined;

    if (!decision || decision.decision !== "yes") {
      return {
        status: 409,
        jsonBody: { error: 'Availability can only be submitted after a "yes" decision.' }
      };
    }

    await pool.request()
      .input("session_id", sql.UniqueIdentifier, body.session_id)
      .input("relationship_id", sql.UniqueIdentifier, relationshipId)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        DELETE FROM dbo.speed_round_availability
        WHERE session_id = @session_id
          AND user_id = @user_id;
      `);

    for (const slot of body.slots) {
      await pool.request()
        .input("session_id", sql.UniqueIdentifier, body.session_id)
        .input("relationship_id", sql.UniqueIdentifier, relationshipId)
        .input("user_id", sql.UniqueIdentifier, authUserId)
        .input("slot_date", sql.Date, slot.date)
        .input("period", sql.NVarChar(20), slot.period)
        .query(`
          INSERT INTO dbo.speed_round_availability (
            session_id,
            relationship_id,
            user_id,
            slot_date,
            period
          )
          VALUES (
            @session_id,
            @relationship_id,
            @user_id,
            @slot_date,
            @period
          );
        `);
    }

    await matchSlotsForSession(body.session_id);

    return {
      status: 200,
      jsonBody: {
        success: true,
        session_id: body.session_id,
        slots_saved: body.slots.length
      }
    };
  } catch (error) {
    context.error("Speed round availability failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown speed round availability error" }
    };
  }
}

app.http("speed-rounds-availability", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "speed-rounds/availability",
  handler: speedRoundsAvailability
});
