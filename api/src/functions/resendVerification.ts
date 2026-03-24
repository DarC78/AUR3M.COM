import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { getDbPool } from "../shared/db";
import { issueEmailVerificationToken } from "../shared/emailVerification";

type ResendVerificationRequest = {
  email?: string;
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

export async function resendVerification(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Resend verification request received.");

  let body: ResendVerificationRequest;

  try {
    body = (await request.json()) as ResendVerificationRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.email)) {
    return badRequest("email is required.");
  }

  try {
    const pool = await getDbPool();
    const normalizedEmail = body.email.trim().toLowerCase();
    const result = await pool.request()
      .input("email", sql.NVarChar(255), normalizedEmail)
      .query(`
        SELECT id, email, username, email_verified, is_active
        FROM dbo.users
        WHERE email = @email;
      `);

    const user = result.recordset[0] as
      | {
          id: string;
          email: string;
          username: string;
          email_verified: boolean;
          is_active: boolean;
        }
      | undefined;

    if (user && user.is_active && !user.email_verified) {
      try {
        await issueEmailVerificationToken(pool, user.id, user.email, user.username);
      } catch (emailError) {
        context.error("Resend verification email failed.", emailError);
      }
    }

    return {
      status: 200,
      jsonBody: {
        message: "If the account exists and is not verified, a new verification email has been sent."
      }
    };
  } catch (error) {
    context.error("Resend verification failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown resend verification error"
      }
    };
  }
}

app.http("auth-resend-verification", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/resend-verification",
  handler: resendVerification
});
