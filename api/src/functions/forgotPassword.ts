import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { randomBytes, createHash } from "crypto";
import sql from "mssql";
import { getDbPool } from "../shared/db";
import { sendPasswordResetEmail } from "../shared/email";

type ForgotPasswordRequest = {
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

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function forgotPassword(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Forgot password request received.");

  let body: ForgotPasswordRequest;

  try {
    body = (await request.json()) as ForgotPasswordRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.email)) {
    return badRequest("email is required.");
  }

  const normalizedEmail = body.email.trim().toLowerCase();

  try {
    const pool = await getDbPool();
    const userResult = await pool.request()
      .input("email", sql.NVarChar(255), normalizedEmail)
      .query(`
        SELECT id, email, username, is_active
        FROM dbo.users
        WHERE email = @email;
      `);

    const user = userResult.recordset[0] as
      | {
          id: string;
          email: string;
          username: string;
          is_active: boolean;
        }
      | undefined;

    if (user?.is_active) {
      const resetToken = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(resetToken);

      await pool.request()
        .input("user_id", sql.UniqueIdentifier, user.id)
        .input("token_hash", sql.NVarChar(64), tokenHash)
        .query(`
          UPDATE dbo.password_reset_tokens
          SET used_at = SYSUTCDATETIME()
          WHERE user_id = @user_id
            AND used_at IS NULL;

          INSERT INTO dbo.password_reset_tokens (
            user_id,
            token_hash,
            expires_at
          )
          VALUES (
            @user_id,
            @token_hash,
            DATEADD(HOUR, 1, SYSUTCDATETIME())
          );
        `);

      try {
        await sendPasswordResetEmail(user.email, user.username, resetToken);
      } catch (emailError) {
        context.error("Password reset email failed.", emailError);
      }
    }

    return {
      status: 200,
      jsonBody: {
        success: true
      }
    };
  } catch (error) {
    context.error("Forgot password failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown forgot password error"
      }
    };
  }
}

app.http("auth-forgot-password", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/forgot-password",
  handler: forgotPassword
});
