import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { getDbPool } from "../shared/db";
import {
  completeEmailVerification,
  hashEmailVerificationToken,
  sendPostVerificationOnboarding
} from "../shared/emailVerification";
import { getPublicAppUrl } from "../shared/stripe";

function redirect(location: string): HttpResponseInit {
  return {
    status: 302,
    headers: {
      Location: location
    }
  };
}

function getLoginRedirect(search: string): string {
  return `${getPublicAppUrl().replace(/\/+$/, "")}/login${search}`;
}

export async function verifyEmail(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Verify email request received.");

  const token = request.query.get("token")?.trim();

  if (!token) {
    return redirect(getLoginRedirect("?verified=false&reason=missing_token"));
  }

  const tokenHash = hashEmailVerificationToken(token);

  try {
    const pool = await getDbPool();
    const transaction = new sql.Transaction(pool);
    let finished = false;
    await transaction.begin();

    try {
      const tokenResult = await transaction.request()
        .input("token_hash", sql.NVarChar(64), tokenHash)
        .query(`
          SELECT user_id
          FROM dbo.email_verification_tokens
          WHERE token_hash = @token_hash
            AND used_at IS NULL
            AND expires_at > SYSUTCDATETIME();
        `);

      const row = tokenResult.recordset[0] as { user_id: string } | undefined;

      if (!row) {
        await transaction.rollback();
        finished = true;
        return redirect(getLoginRedirect("?verified=false&reason=invalid_token"));
      }

      const user = await completeEmailVerification(transaction, row.user_id);

      await transaction.request()
        .input("user_id", sql.UniqueIdentifier, row.user_id)
        .query(`
          UPDATE dbo.email_verification_tokens
          SET used_at = SYSUTCDATETIME()
          WHERE user_id = @user_id
            AND used_at IS NULL;
        `);

      await transaction.commit();
      finished = true;

      if (user) {
        try {
          await sendPostVerificationOnboarding(
            user.email,
            user.username,
            user.alias,
            new Date(user.createdAt)
          );
        } catch (emailError) {
          context.error("Post-verification onboarding emails failed.", emailError);
        }
      }

      return redirect(getLoginRedirect("?verified=true"));
    } catch (error) {
      if (!finished) {
        await transaction.rollback();
      }
      throw error;
    }
  } catch (error) {
    context.error("Verify email failed.", error);
    return redirect(getLoginRedirect("?verified=false&reason=server_error"));
  }
}

app.http("auth-verify-email", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth/verify-email",
  handler: verifyEmail
});
