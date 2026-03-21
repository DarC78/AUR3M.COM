import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { getDbPool } from "../shared/db";

const allowedGenders = new Set(["male", "female", "non-binary", "prefer-not-to-say"]);
const allowedAgeBrackets = new Set(["18-25", "26-35", "36-45", "46-55", "55+"]);

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

export async function members(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Members request received.");

  const gender = request.query.get("gender")?.trim() || null;
  const ageBracket = request.query.get("age_bracket")?.trim() || null;
  const location = request.query.get("location")?.trim() || null;

  if (gender && !allowedGenders.has(gender)) {
    return badRequest("gender is invalid.");
  }

  if (ageBracket && !allowedAgeBrackets.has(ageBracket)) {
    return badRequest("age_bracket is invalid.");
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("gender", sql.NVarChar(50), gender)
      .input("age_bracket", sql.NVarChar(20), ageBracket)
      .input("location", sql.NVarChar(150), location)
      .query(`
        SELECT TOP (100)
          id,
          username,
          display_name AS alias,
          membership,
          current_tier,
          gender,
          age_bracket,
          location,
          profession
        FROM dbo.users
        WHERE is_active = 1
          AND (@gender IS NULL OR gender = @gender)
          AND (@age_bracket IS NULL OR age_bracket = @age_bracket)
          AND (@location IS NULL OR location = @location)
        ORDER BY created_at DESC;
      `);

    return {
      status: 200,
      jsonBody: {
        members: result.recordset
      }
    };
  } catch (error) {
    context.error("Members lookup failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown members error"
      }
    };
  }
}

app.http("members", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "members",
  handler: members
});
