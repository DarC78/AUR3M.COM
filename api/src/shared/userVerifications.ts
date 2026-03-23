import sql, { ConnectionPool } from "mssql";

export type VerificationPurpose = "date";
export type VerificationStatus = "pending" | "processing" | "verified" | "requires_input" | "canceled";

export type RelationshipVerificationState = {
  userVerified: boolean;
  partnerVerified: boolean;
  bothVerified: boolean;
  userStatus: VerificationStatus | "not_started";
  partnerStatus: VerificationStatus | "not_started";
};

type VerificationInsert = {
  userId: string;
  relationshipId: string | null;
  providerSessionId: string;
  status: VerificationStatus;
  metadata?: Record<string, unknown> | null;
};

export async function createUserVerification(
  pool: ConnectionPool,
  params: VerificationInsert
): Promise<void> {
  await pool.request()
    .input("user_id", sql.UniqueIdentifier, params.userId)
    .input("relationship_id", sql.UniqueIdentifier, params.relationshipId)
    .input("provider_session_id", sql.NVarChar(255), params.providerSessionId)
    .input("status", sql.NVarChar(50), params.status)
    .input("metadata_json", sql.NVarChar(sql.MAX), params.metadata ? JSON.stringify(params.metadata) : null)
    .query(`
      INSERT INTO dbo.user_verifications (
        user_id,
        relationship_id,
        provider,
        verification_purpose,
        provider_session_id,
        status,
        metadata_json
      )
      VALUES (
        @user_id,
        @relationship_id,
        'stripe_identity',
        'date',
        @provider_session_id,
        @status,
        @metadata_json
      );
    `);
}

export async function updateUserVerificationFromStripeSession(
  pool: ConnectionPool,
  providerSessionId: string,
  status: VerificationStatus,
  metadata?: Record<string, unknown> | null,
  lastErrorCode?: string | null,
  lastErrorReason?: string | null
): Promise<void> {
  await pool.request()
    .input("provider_session_id", sql.NVarChar(255), providerSessionId)
    .input("status", sql.NVarChar(50), status)
    .input("metadata_json", sql.NVarChar(sql.MAX), metadata ? JSON.stringify(metadata) : null)
    .input("last_error_code", sql.NVarChar(100), lastErrorCode ?? null)
    .input("last_error_reason", sql.NVarChar(500), lastErrorReason ?? null)
    .query(`
      UPDATE dbo.user_verifications
      SET status = @status,
          verified_at = CASE WHEN @status = 'verified' THEN COALESCE(verified_at, SYSUTCDATETIME()) ELSE verified_at END,
          last_error_code = @last_error_code,
          last_error_reason = @last_error_reason,
          metadata_json = COALESCE(@metadata_json, metadata_json),
          updated_at = SYSUTCDATETIME()
      WHERE provider_session_id = @provider_session_id;
    `);
}

export async function getLatestUserVerification(
  pool: ConnectionPool,
  userId: string,
  relationshipId: string
): Promise<{ id: string; provider_session_id: string; status: VerificationStatus } | undefined> {
  const result = await pool.request()
    .input("user_id", sql.UniqueIdentifier, userId)
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .query(`
      SELECT TOP 1 id, provider_session_id, status
      FROM dbo.user_verifications
      WHERE user_id = @user_id
        AND relationship_id = @relationship_id
        AND verification_purpose = 'date'
      ORDER BY created_at DESC;
    `);

  return result.recordset[0] as
    | { id: string; provider_session_id: string; status: VerificationStatus }
    | undefined;
}

export async function getRelationshipVerificationState(
  pool: ConnectionPool,
  relationshipId: string,
  authUserId: string
): Promise<RelationshipVerificationState> {
  const relationshipResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .input("user_id", sql.UniqueIdentifier, authUserId)
    .query(`
      SELECT TOP 1 user_a_id, user_b_id
      FROM dbo.relationships
      WHERE id = @relationship_id
        AND (@user_id = user_a_id OR @user_id = user_b_id);
    `);

  const relationship = relationshipResult.recordset[0] as
    | { user_a_id: string; user_b_id: string }
    | undefined;

  if (!relationship) {
    throw new Error("Relationship not found for this user.");
  }

  const ownUserId = authUserId.toLowerCase() === relationship.user_a_id.toLowerCase()
    ? relationship.user_a_id
    : relationship.user_b_id;
  const partnerUserId = ownUserId.toLowerCase() === relationship.user_a_id.toLowerCase()
    ? relationship.user_b_id
    : relationship.user_a_id;

  const latestResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .input("user_a_id", sql.UniqueIdentifier, ownUserId)
    .input("user_b_id", sql.UniqueIdentifier, partnerUserId)
    .query(`
      WITH ranked AS (
        SELECT
          user_id,
          status,
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS row_num
        FROM dbo.user_verifications
        WHERE relationship_id = @relationship_id
          AND user_id IN (@user_a_id, @user_b_id)
          AND verification_purpose = 'date'
      )
      SELECT user_id, status
      FROM ranked
      WHERE row_num = 1;
    `);

  const rows = latestResult.recordset as Array<{ user_id: string; status: VerificationStatus }>;
  const ownStatus = rows.find((row) => row.user_id.toLowerCase() === ownUserId.toLowerCase())?.status ?? "not_started";
  const partnerStatus = rows.find((row) => row.user_id.toLowerCase() === partnerUserId.toLowerCase())?.status ?? "not_started";

  return {
    userVerified: ownStatus === "verified",
    partnerVerified: partnerStatus === "verified",
    bothVerified: ownStatus === "verified" && partnerStatus === "verified",
    userStatus: ownStatus,
    partnerStatus
  };
}
