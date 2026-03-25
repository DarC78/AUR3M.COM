import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { hash } from "bcryptjs";
import sql from "mssql";
import { getDbPool } from "../shared/db";
import { issueEmailVerificationToken } from "../shared/emailVerification";

type SignupRequest = {
  username?: string;
  email?: string;
  password?: string;
  gender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  age_bracket?: "18-25" | "26-35" | "36-45" | "46-55" | "55+";
  location?: string;
  travel_region_code?: string;
  profession?: string;
  interested_in?: "men" | "women" | "both";
};

const allowedGenders = new Set(["male", "female", "non-binary", "prefer-not-to-say"]);
const allowedAgeBrackets = new Set(["18-25", "26-35", "36-45", "46-55", "55+"]);
const allowedInterestedIn = new Set(["men", "women", "both"]);

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function signup(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Signup request received.");

  let body: SignupRequest;

  try {
    body = (await request.json()) as SignupRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.username)) {
    return badRequest("username is required.");
  }

  if (!isNonEmptyString(body.email)) {
    return badRequest("email is required.");
  }

  if (!isNonEmptyString(body.password) || body.password.length < 8) {
    return badRequest("password must be at least 8 characters.");
  }

  if (!isNonEmptyString(body.profession)) {
    return badRequest("profession is required.");
  }

  if (!body.gender || !allowedGenders.has(body.gender)) {
    return badRequest("gender is invalid.");
  }

  if (!body.age_bracket || !allowedAgeBrackets.has(body.age_bracket)) {
    return badRequest("age_bracket is invalid.");
  }

  if (!body.interested_in || !allowedInterestedIn.has(body.interested_in)) {
    return badRequest("interested_in is invalid.");
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const username = body.username.trim();
  const passwordHash = await hash(body.password, 12);
  const travelRegionCode = typeof body.travel_region_code === "string"
    ? body.travel_region_code.trim().toUpperCase()
    : null;

  try {
    const pool = await getDbPool();
    let resolvedLocation = isNonEmptyString(body.location) ? body.location.trim() : null;

    if (travelRegionCode) {
      const travelRegionResult = await pool.request()
        .input("code", sql.NVarChar(50), travelRegionCode)
        .query(`
          SELECT TOP 1 code, name
          FROM dbo.travel_regions
          WHERE code = @code;
        `);

      const travelRegion = travelRegionResult.recordset[0] as { code: string; name: string } | undefined;

      if (!travelRegion) {
        return badRequest("travel_region_code is invalid.");
      }

      if (!resolvedLocation) {
        resolvedLocation = travelRegion.name;
      }
    }

    if (!resolvedLocation) {
      return badRequest("travel_region_code is required.");
    }

    const result = await pool.request()
      .input("email", sql.NVarChar(255), normalizedEmail)
      .input("username", sql.NVarChar(50), username)
      .input("display_name", sql.NVarChar(150), username)
      .input("password_hash", sql.NVarChar(255), passwordHash)
      .input("gender", sql.NVarChar(50), body.gender)
      .input("age_bracket", sql.NVarChar(20), body.age_bracket)
      .input("location", sql.NVarChar(150), resolvedLocation)
      .input("travel_region_code", sql.NVarChar(50), travelRegionCode)
      .input("profession", sql.NVarChar(150), body.profession.trim())
      .input("interested_in", sql.NVarChar(20), body.interested_in)
      .input("membership", sql.NVarChar(20), "free")
      .input("current_tier", sql.Int, 0)
      .input("is_test_member", sql.Bit, false)
      .input("prefers_camera_off_3min", sql.Bit, false)
      .input("timezone", sql.NVarChar(100), "Europe/London")
      .input("email_verified", sql.Bit, false)
      .query(`
        INSERT INTO dbo.users (
          email,
          username,
          display_name,
          password_hash,
          gender,
          age_bracket,
          location,
          travel_region_code,
          profession,
          interested_in,
          membership,
          current_tier,
          is_test_member,
          prefers_camera_off_3min,
          timezone,
          email_verified
        )
        OUTPUT
          INSERTED.id,
          INSERTED.email,
          INSERTED.username,
          INSERTED.display_name
        VALUES (
          @email,
          @username,
          @display_name,
          @password_hash,
          @gender,
          @age_bracket,
          @location,
          @travel_region_code,
          @profession,
          @interested_in,
          @membership,
          @current_tier,
          @is_test_member,
          @prefers_camera_off_3min,
          @timezone,
          @email_verified
        );
      `);

    const newUser = result.recordset[0] as {
      id: string;
      email: string;
      username: string;
      display_name: string;
    };

    try {
      await issueEmailVerificationToken(pool, newUser.id, newUser.email, newUser.username);
    } catch (emailError) {
      context.error("Signup verification email failed.", emailError);
    }

    return {
      status: 201,
      jsonBody: {
        message: "Verification email sent",
        email_verified: false
      }
    };
  } catch (error) {
    context.error("Signup failed.", error);

    const message = error instanceof Error ? error.message : "Unknown signup error";
    const duplicate =
      message.includes("UQ_users_email") ||
      message.includes("UQ_users_username") ||
      message.includes("Violation of UNIQUE KEY constraint");

    return {
      status: duplicate ? 409 : 500,
      jsonBody: {
        error: duplicate ? "A user with that email or username already exists." : message
      }
    };
  }
}

app.http("auth-signup", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/signup",
  handler: signup
});
