import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getDbPool } from "../shared/db";
import { syncSpeedRoundEventStatuses } from "../shared/speedRoundEvents";

type SpeedRoundEventType = "test" | "live";

function parseEventType(request: HttpRequest): SpeedRoundEventType {
  const value = request.query.get("event_type")?.trim().toLowerCase();

  if (value === "live") {
    return "live";
  }

  return "test";
}

export async function speedRoundsUpcoming(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Upcoming speed rounds request received.");

  try {
    const pool = await getDbPool();
    await syncSpeedRoundEventStatuses(pool);
    const eventType = parseEventType(request);
    const result = await pool.request().query(`
      SELECT
        id,
        title,
        starts_at,
        ends_at,
        room_name,
        capacity,
        status,
        event_type
      FROM dbo.speed_round_events
      WHERE ends_at > SYSUTCDATETIME()
        AND status IN ('scheduled', 'live')
        AND ${eventType === "live"
          ? "event_type = 'live'"
          : "event_type IN ('test', 'live')"}
      ORDER BY starts_at ASC;
    `);

    return {
      status: 200,
      jsonBody: {
        event_type: eventType,
        events: result.recordset
      }
    };
  } catch (error) {
    context.error("Upcoming speed rounds lookup failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown speed round error"
      }
    };
  }
}

app.http("speed-rounds-upcoming", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "speed-rounds/upcoming",
  handler: speedRoundsUpcoming
});
