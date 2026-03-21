import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getDbPool } from "../shared/db";

export async function dbHealth(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Database health check request received.");

  try {
    const pool = await getDbPool();
    const result = await pool.request().query("SELECT DB_NAME() AS database_name, SYSUTCDATETIME() AS utc_now;");
    const row = result.recordset[0];

    return {
      status: 200,
      jsonBody: {
        service: "aur3m-api",
        status: "ok",
        database: row.database_name,
        timestamp: row.utc_now
      }
    };
  } catch (error) {
    context.error("Database health check failed.", error);

    return {
      status: 500,
      jsonBody: {
        service: "aur3m-api",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown database error"
      }
    };
  }
}

app.http("db-health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "db-health",
  handler: dbHealth
});
