import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

export async function profile(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Profile request received.");

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

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT
          display_name AS alias,
          membership,
          current_tier,
          gender,
          age_bracket,
          location,
          profession
        FROM dbo.users
        WHERE id = @id AND is_active = 1;
      `);

    const user = result.recordset[0];

    if (!user) {
      return {
        status: 404,
        jsonBody: {
          error: "User not found."
        }
      };
    }

    return {
      status: 200,
      jsonBody: user
    };
  } catch (error) {
    context.error("Profile lookup failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown profile error"
      }
    };
  }
}

app.http("profile", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "profile",
  handler: profile
});
