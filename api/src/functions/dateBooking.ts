import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { getRelationshipParticipants } from "../shared/dateFlow";

export async function dateBooking(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Date booking request received.");

  let auth;
  try {
    auth = requireAuth(request);
  } catch (error) {
    return { status: 401, jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" } };
  }

  const relationshipId = request.params.relationshipId;
  if (!relationshipId) {
    return { status: 400, jsonBody: { error: "relationshipId is required." } };
  }

  try {
    const pool = await getDbPool();
    const relationship = await getRelationshipParticipants(pool, relationshipId, auth.sub);
    if (!relationship) {
      return { status: 404, jsonBody: { error: "Relationship not found for this user." } };
    }

    const result = await pool.request()
      .input("relationship_id", sql.UniqueIdentifier, relationshipId)
      .query(`
        SELECT TOP 1
          id,
          relationship_id,
          scheduled_at,
          venue,
          venue_address,
          status
        FROM dbo.date_bookings
        WHERE relationship_id = @relationship_id;
      `);

    const booking = result.recordset[0];
    if (!booking) {
      return { status: 404, jsonBody: { error: "No booking exists yet." } };
    }

    return { status: 200, jsonBody: booking };
  } catch (error) {
    context.error("Date booking lookup failed.", error);
    return { status: 500, jsonBody: { error: error instanceof Error ? error.message : "Unknown date booking error" } };
  }
}

app.http("dates-booking", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "dates/{relationshipId}/booking",
  handler: dateBooking
});
