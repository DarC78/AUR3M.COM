import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import sql from "mssql";
import { getDbPool } from "../shared/db";

type ResetPasswordRequest = {
  token?: string;
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

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function resetPassword(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Reset password request received.");

  let body: ResetPasswordRequest;

  try {
    body = (await request.json()) as ResetPasswordRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.token)) {
    return badRequest("token is required.");
  }

  if (!isNonEmptyString(body.password) || body.password.length < 8) {
    return badRequest("password must be at least 8 characters.");
  }

  const tokenHash = hashResetToken(body.token.trim());
  const passwordHash = await hash(body.password, 12);

  try {
    const pool = await getDbPool();
    const transaction = new sql.Transaction(pool);
    let transactionFinished = false;
    await transaction.begin();

    try {
      const tokenResult = await transaction.request()
        .input("token_hash", sql.NVarChar(64), tokenHash)
        .query(`
          SELECT user_id
          FROM dbo.password_reset_tokens
          WHERE token_hash = @token_hash
            AND used_at IS NULL
            AND expires_at > SYSUTCDATETIME();
        `);

      const tokenRow = tokenResult.recordset[0] as { user_id: string } | undefined;

      if (!tokenRow) {
        await transaction.rollback();
        transactionFinished = true;

        return {
          status: 400,
          jsonBody: {
            error: "Invalid or expired reset token."
          }
        };
      }

      await transaction.request()
        .input("user_id", sql.UniqueIdentifier, tokenRow.user_id)
        .input("password_hash", sql.NVarChar(255), passwordHash)
        .input("token_hash", sql.NVarChar(64), tokenHash)
        .query(`
          UPDATE dbo.users
          SET password_hash = @password_hash,
              updated_at = SYSUTCDATETIME()
          WHERE id = @user_id;

          UPDATE dbo.password_reset_tokens
          SET used_at = SYSUTCDATETIME()
          WHERE user_id = @user_id
            AND used_at IS NULL;
        `);

      await transaction.commit();
      transactionFinished = true;

      return {
        status: 200,
        jsonBody: {
          success: true
        }
      };
    } catch (error) {
      if (!transactionFinished) {
        await transaction.rollback();
        transactionFinished = true;
      }

      throw error;
    }
  } catch (error) {
    context.error("Reset password failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown reset password error"
      }
    };
  }
}

app.http("auth-reset-password", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/reset-password",
  handler: resetPassword
});
