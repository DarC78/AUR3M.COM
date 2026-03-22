import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

type ProfilePatchRequest = {
  age_bracket?: "18-25" | "26-35" | "36-45" | "46-55" | "55+";
  location?: string;
  timezone?: string;
};

const allowedAgeBrackets = new Set(["18-25", "26-35", "36-45", "46-55", "55+"]);

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

async function fetchProfile(authUserId: string): Promise<HttpResponseInit> {
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
        profession,
        timezone
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
}

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
    if (request.method === "GET") {
      return await fetchProfile(authUserId);
    }

    if (request.method === "PATCH") {
      let body: ProfilePatchRequest;

      try {
        body = (await request.json()) as ProfilePatchRequest;
      } catch {
        return badRequest("Request body must be valid JSON.");
      }

      const hasAgeBracket = Object.prototype.hasOwnProperty.call(body, "age_bracket");
      const hasLocation = Object.prototype.hasOwnProperty.call(body, "location");
      const hasTimezone = Object.prototype.hasOwnProperty.call(body, "timezone");

      if (!hasAgeBracket && !hasLocation && !hasTimezone) {
        return badRequest("At least one of age_bracket, location, or timezone must be provided.");
      }

      if (hasAgeBracket && body.age_bracket && !allowedAgeBrackets.has(body.age_bracket)) {
        return badRequest("age_bracket is invalid.");
      }

      if (hasLocation && typeof body.location !== "string") {
        return badRequest("location must be a string.");
      }

      if (hasTimezone && typeof body.timezone !== "string") {
        return badRequest("timezone must be a string.");
      }

      const pool = await getDbPool();
      await pool.request()
        .input("id", sql.UniqueIdentifier, authUserId)
        .input("has_age_bracket", sql.Bit, hasAgeBracket ? 1 : 0)
        .input("has_location", sql.Bit, hasLocation ? 1 : 0)
        .input("has_timezone", sql.Bit, hasTimezone ? 1 : 0)
        .input("age_bracket", sql.NVarChar(20), hasAgeBracket ? body.age_bracket ?? null : null)
        .input("location", sql.NVarChar(150), hasLocation ? body.location?.trim() ?? null : null)
        .input("timezone", sql.NVarChar(100), hasTimezone ? body.timezone?.trim() ?? null : null)
        .query(`
          UPDATE dbo.users
          SET
            age_bracket = CASE
              WHEN @has_age_bracket = 1
                THEN @age_bracket
              ELSE age_bracket
            END,
            location = CASE
              WHEN @has_location = 1
                THEN @location
              ELSE location
            END,
            timezone = CASE
              WHEN @has_timezone = 1
                THEN @timezone
              ELSE timezone
            END,
            updated_at = SYSUTCDATETIME()
          WHERE id = @id AND is_active = 1;
        `);

      return await fetchProfile(authUserId);
    }

    return {
      status: 405,
      jsonBody: {
        error: "Method not allowed."
      }
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
  methods: ["GET", "PATCH"],
  authLevel: "anonymous",
  route: "profile",
  handler: profile
});
