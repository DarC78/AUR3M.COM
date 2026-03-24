import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { compare } from "bcryptjs";
import sql from "mssql";
import { getDbPool } from "../shared/db";
import { signAuthToken } from "../shared/jwt";

type LoginRequest = {
  email?: string;
  password?: string;
};

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

export async function login(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Login request received.");

  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.email)) {
    return badRequest("email is required.");
  }

  if (!isNonEmptyString(body.password)) {
    return badRequest("password is required.");
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("email", sql.NVarChar(255), body.email.trim().toLowerCase())
      .query(`
        SELECT
          id,
          email,
          username,
          display_name,
          password_hash,
          membership,
          current_tier,
          is_active,
          email_verified
        FROM dbo.users
        WHERE email = @email;
      `);

    const user = result.recordset[0] as
      | {
          id: string;
          email: string;
          username: string;
          display_name: string;
          password_hash: string;
          membership: string;
          current_tier: number;
          is_active: boolean;
          email_verified: boolean;
        }
      | undefined;

    if (!user || !user.is_active) {
      return {
        status: 401,
        jsonBody: {
          error: "Invalid email or password."
        }
      };
    }

    const passwordMatches = await compare(body.password, user.password_hash);

    if (!passwordMatches) {
      return {
        status: 401,
        jsonBody: {
          error: "Invalid email or password."
        }
      };
    }

    if (!user.email_verified) {
      return {
        status: 403,
        jsonBody: {
          error: "email_not_verified",
          message: "Please verify your email first"
        }
      };
    }

    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      username: user.username
    });

    return {
      status: 200,
      jsonBody: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          alias: user.display_name,
          membership: user.membership,
          current_tier: user.current_tier
        }
      }
    };
  } catch (error) {
    context.error("Login failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown login error"
      }
    };
  }
}

app.http("auth-login", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: login
});
