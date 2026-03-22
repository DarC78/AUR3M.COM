import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

export async function relationships(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Relationships request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return {
      status: 401,
      jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" }
    };
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT
          r.id,
          CASE
            WHEN r.user_a_id = @user_id THEN ub.display_name
            ELSE ua.display_name
          END AS partner_alias,
          r.stage,
          r.started_at,
          r.last_updated
        FROM dbo.relationships r
        INNER JOIN dbo.users ua
          ON ua.id = r.user_a_id
        INNER JOIN dbo.users ub
          ON ub.id = r.user_b_id
        WHERE (@user_id = r.user_a_id OR @user_id = r.user_b_id)
          AND r.stage NOT IN ('passed', 'revealed')
        ORDER BY r.last_updated DESC;
      `);

    return {
      status: 200,
      jsonBody: {
        relationships: result.recordset
      }
    };
  } catch (error) {
    context.error("Relationships lookup failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown relationships error" }
    };
  }
}

app.http("relationships", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "relationships",
  handler: relationships
});
