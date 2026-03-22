import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { getDatePaymentState, tryBookGoldDate } from "../shared/dateFlow";

type DateAvailabilityRequest = {
  relationship_id?: string;
  slots?: Array<{ date: string; time: "18:00" | "18:30" | "19:00" | "19:30" }>;
};

const allowedTimes = new Set(["18:00", "18:30", "19:00", "19:30"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(message: string): HttpResponseInit {
  return { status: 400, jsonBody: { error: message } };
}

function isWithinDateWindow(dateValue: string): boolean {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 7));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 30));
  const slot = new Date(`${dateValue}T00:00:00.000Z`);
  return slot >= start && slot <= end;
}

export async function dateAvailability(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Date availability request received.");

  let auth;
  try {
    auth = requireAuth(request);
  } catch (error) {
    return { status: 401, jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" } };
  }

  let body: DateAvailabilityRequest;
  try {
    body = (await request.json()) as DateAvailabilityRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.relationship_id) {
    return badRequest("relationship_id is required.");
  }

  if (!Array.isArray(body.slots) || body.slots.length === 0) {
    return badRequest("At least one slot is required.");
  }

  for (const slot of body.slots) {
    if (!isoDatePattern.test(slot.date) || !allowedTimes.has(slot.time) || !isWithinDateWindow(slot.date)) {
      return badRequest("Slots must be within the 7 to 30 day window and use 18:00, 18:30, 19:00, or 19:30.");
    }
  }

  try {
    const pool = await getDbPool();
    const paymentState = await getDatePaymentState(pool, body.relationship_id, auth.sub);
    if (!paymentState.bothPaid) {
      return { status: 403, jsonBody: { error: "Both users haven't paid yet." } };
    }

    const existingBooking = await pool.request()
      .input("relationship_id", sql.UniqueIdentifier, body.relationship_id)
      .query(`
        SELECT TOP 1 id
        FROM dbo.date_bookings
        WHERE relationship_id = @relationship_id;
      `);

    if (existingBooking.recordset[0]) {
      return { status: 409, jsonBody: { error: "Date booking already exists." } };
    }

    await pool.request()
      .input("relationship_id", sql.UniqueIdentifier, body.relationship_id)
      .input("user_id", sql.UniqueIdentifier, auth.sub)
      .query(`
        DELETE FROM dbo.date_availability
        WHERE relationship_id = @relationship_id
          AND user_id = @user_id;
      `);

    for (const slot of body.slots) {
      await pool.request()
        .input("relationship_id", sql.UniqueIdentifier, body.relationship_id)
        .input("user_id", sql.UniqueIdentifier, auth.sub)
        .input("slot_date", sql.Date, slot.date)
        .input("slot_time", sql.NVarChar(5), slot.time)
        .query(`
          INSERT INTO dbo.date_availability (
            relationship_id,
            user_id,
            slot_date,
            slot_time
          )
          VALUES (
            @relationship_id,
            @user_id,
            @slot_date,
            @slot_time
          );
        `);
    }

    await tryBookGoldDate(body.relationship_id);

    return { status: 200, jsonBody: { success: true, slots_saved: body.slots.length } };
  } catch (error) {
    context.error("Date availability failed.", error);
    return { status: 500, jsonBody: { error: error instanceof Error ? error.message : "Unknown date availability error" } };
  }
}

app.http("dates-availability", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "dates/availability",
  handler: dateAvailability
});
