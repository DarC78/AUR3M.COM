import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { hash } from "bcryptjs";
import sql from "mssql";
import { getDbPool } from "../shared/db";
import { enqueueSignupFollowUpEmails, sendSignupWelcomeEmail } from "../shared/email";

type SignupRequest = {
  username?: string;
  email?: string;
  password?: string;
  gender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  age_bracket?: "18-25" | "26-35" | "36-45" | "46-55" | "55+";
  location?: string;
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

  if (!isNonEmptyString(body.location)) {
    return badRequest("location is required.");
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

  try {
    const pool = await getDbPool();

    const result = await pool.request()
      .input("email", sql.NVarChar(255), normalizedEmail)
      .input("username", sql.NVarChar(50), username)
      .input("display_name", sql.NVarChar(150), username)
      .input("password_hash", sql.NVarChar(255), passwordHash)
      .input("gender", sql.NVarChar(50), body.gender)
      .input("age_bracket", sql.NVarChar(20), body.age_bracket)
      .input("location", sql.NVarChar(150), body.location.trim())
      .input("profession", sql.NVarChar(150), body.profession.trim())
      .input("interested_in", sql.NVarChar(20), body.interested_in)
      .input("membership", sql.NVarChar(20), "free")
      .input("current_tier", sql.Int, 0)
      .query(`
        INSERT INTO dbo.users (
          email,
          username,
          display_name,
          password_hash,
          gender,
          age_bracket,
          location,
          profession,
          interested_in,
          membership,
          current_tier
        )
        OUTPUT
          INSERTED.id,
          INSERTED.email,
          INSERTED.username,
          INSERTED.display_name,
          INSERTED.membership,
          INSERTED.current_tier,
          INSERTED.created_at
        VALUES (
          @email,
          @username,
          @display_name,
          @password_hash,
          @gender,
          @age_bracket,
          @location,
          @profession,
          @interested_in,
          @membership,
          @current_tier
        );
      `);

    const newUser = result.recordset[0] as {
      id: string;
      email: string;
      username: string;
      display_name: string;
      membership: string;
      current_tier: number;
      created_at: string;
    };

    try {
      await sendSignupWelcomeEmail(newUser.email, newUser.username, newUser.display_name);
    } catch (emailError) {
      context.error("Signup welcome email failed.", emailError);
    }

    try {
      await enqueueSignupFollowUpEmails(
        newUser.email,
        newUser.username,
        newUser.display_name,
        new Date(newUser.created_at)
      );
    } catch (emailError) {
      context.error("Signup follow-up email scheduling failed.", emailError);
    }

    return {
      status: 201,
      jsonBody: {
        user: newUser
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
