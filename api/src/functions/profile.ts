import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

type ProfilePatchRequest = {
  age_bracket?: "18-25" | "26-35" | "36-45" | "46-55" | "55+";
  location?: string;
  timezone?: string;
  prefers_camera_off_3min?: boolean;
  travel_region_code?: string | null;
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
        timezone,
        prefers_camera_off_3min,
        u.travel_region_code,
        tr.name AS travel_region_name,
        tr.nation AS travel_region_nation
      FROM dbo.users u
      LEFT JOIN dbo.travel_regions tr
        ON tr.code = u.travel_region_code
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
      const hasCameraPreference = Object.prototype.hasOwnProperty.call(body, "prefers_camera_off_3min");
      const hasTravelRegion = Object.prototype.hasOwnProperty.call(body, "travel_region_code");

      if (!hasAgeBracket && !hasLocation && !hasTimezone && !hasCameraPreference && !hasTravelRegion) {
        return badRequest("At least one of age_bracket, location, timezone, prefers_camera_off_3min, or travel_region_code must be provided.");
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

      if (hasCameraPreference && typeof body.prefers_camera_off_3min !== "boolean") {
        return badRequest("prefers_camera_off_3min must be a boolean.");
      }

      if (
        hasTravelRegion &&
        body.travel_region_code !== null &&
        typeof body.travel_region_code !== "string"
      ) {
        return badRequest("travel_region_code must be a string or null.");
      }

      const normalizedTravelRegionCode = hasTravelRegion && typeof body.travel_region_code === "string"
        ? body.travel_region_code.trim().toUpperCase()
        : body.travel_region_code ?? null;

      const pool = await getDbPool();

      if (hasTravelRegion && normalizedTravelRegionCode) {
        const travelRegionResult = await pool.request()
          .input("code", sql.NVarChar(50), normalizedTravelRegionCode)
          .query(`
            SELECT TOP 1 code
            FROM dbo.travel_regions
            WHERE code = @code;
          `);

        if (!travelRegionResult.recordset[0]) {
          return badRequest("travel_region_code is invalid.");
        }
      }

      await pool.request()
        .input("id", sql.UniqueIdentifier, authUserId)
        .input("has_age_bracket", sql.Bit, hasAgeBracket ? 1 : 0)
        .input("has_location", sql.Bit, hasLocation ? 1 : 0)
        .input("has_timezone", sql.Bit, hasTimezone ? 1 : 0)
        .input("has_camera_preference", sql.Bit, hasCameraPreference ? 1 : 0)
        .input("has_travel_region", sql.Bit, hasTravelRegion ? 1 : 0)
        .input("age_bracket", sql.NVarChar(20), hasAgeBracket ? body.age_bracket ?? null : null)
        .input("location", sql.NVarChar(150), hasLocation ? body.location?.trim() ?? null : null)
        .input("timezone", sql.NVarChar(100), hasTimezone ? body.timezone?.trim() ?? null : null)
        .input("prefers_camera_off_3min", sql.Bit, hasCameraPreference ? body.prefers_camera_off_3min : null)
        .input("travel_region_code", sql.NVarChar(50), hasTravelRegion ? normalizedTravelRegionCode : null)
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
            prefers_camera_off_3min = CASE
              WHEN @has_camera_preference = 1
                THEN @prefers_camera_off_3min
              ELSE prefers_camera_off_3min
            END,
            travel_region_code = CASE
              WHEN @has_travel_region = 1
                THEN @travel_region_code
              ELSE travel_region_code
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
