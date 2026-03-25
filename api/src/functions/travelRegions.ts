import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getDbPool } from "../shared/db";

export async function travelRegions(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Travel regions request received.");

  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        code,
        name
      FROM dbo.travel_regions
      ORDER BY
        name ASC;
    `);

    return {
      status: 200,
      jsonBody: result.recordset
    };
  } catch (error) {
    context.error("Travel regions lookup failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown travel region error"
      }
    };
  }
}

app.http("travel-regions", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "travel-regions",
  handler: travelRegions
});
