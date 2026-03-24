import { createHash, randomBytes } from "crypto";
import sql from "mssql";
import type { ConnectionPool, Transaction } from "mssql";
import { enqueueSignupFollowUpEmails, sendSignupWelcomeEmail, sendVerificationEmail } from "./email";
import { getPublicAppUrl } from "./stripe";

type DbExecutor = ConnectionPool | Transaction;

function getApiBaseUrl(): string {
  const explicit = process.env.PUBLIC_API_URL ?? process.env.API_BASE_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  return `${getPublicAppUrl().replace(/\/+$/, "")}/api`;
}

export function hashEmailVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueEmailVerificationToken(
  executor: DbExecutor,
  userId: string,
  email: string,
  username: string
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashEmailVerificationToken(token);

  await executor.request()
    .input("user_id", sql.UniqueIdentifier, userId)
    .input("token_hash", sql.NVarChar(64), tokenHash)
    .query(`
      UPDATE dbo.email_verification_tokens
      SET used_at = SYSUTCDATETIME()
      WHERE user_id = @user_id
        AND used_at IS NULL;

      INSERT INTO dbo.email_verification_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (
        @user_id,
        @token_hash,
        DATEADD(HOUR, 24, SYSUTCDATETIME())
      );
    `);

  await sendVerificationEmail(email, username, `${getApiBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export async function completeEmailVerification(
  executor: DbExecutor,
  userId: string
): Promise<{ email: string; username: string; alias: string; createdAt: Date | string } | undefined> {
  const result = await executor.request()
    .input("user_id", sql.UniqueIdentifier, userId)
    .query(`
      UPDATE dbo.users
      SET email_verified = 1,
          email_verified_at = COALESCE(email_verified_at, SYSUTCDATETIME()),
          updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.email, INSERTED.username, INSERTED.display_name, INSERTED.created_at
      WHERE id = @user_id;
    `);

  const row = result.recordset[0] as
    | {
        email: string;
        username: string;
        display_name: string;
        created_at: Date | string;
      }
    | undefined;

  if (!row) {
    return undefined;
  }

  return {
    email: row.email,
    username: row.username,
    alias: row.display_name,
    createdAt: row.created_at
  };
}

export async function sendPostVerificationOnboarding(
  email: string,
  username: string,
  alias: string,
  createdAt: Date
): Promise<void> {
  await sendSignupWelcomeEmail(email, username, alias);
  await enqueueSignupFollowUpEmails(email, username, alias, createdAt);
}
