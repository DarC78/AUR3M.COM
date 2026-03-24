import sql from "mssql";
import type { ConnectionPool } from "mssql";

export type RelationshipStage =
  | "3min"
  | "passed"
  | "15min"
  | "60min"
  | "date"
  | "revealed";

export type AvailabilityPeriod = "morning" | "afternoon" | "evening";

export type SessionRelationshipContext = {
  sessionId: string;
  sessionTier: "3min" | "15min" | "60min" | "date";
  relationshipId: string | null;
  relationshipStage: RelationshipStage | null;
  participantAId: string;
  participantBId: string;
  participantAUserId: string;
  participantBUserId: string;
  participantAAlias: string;
  participantBAlias: string;
  participantAEmail: string;
  participantBEmail: string;
};

const stageRank: Record<RelationshipStage, number> = {
  "3min": 1,
  passed: 99,
  "15min": 2,
  "60min": 3,
  date: 4,
  revealed: 100
};

export function getScheduledAtForSlot(date: string, period: AvailabilityPeriod): Date {
  const hour = period === "morning" ? 9 : period === "afternoon" ? 12 : 17;
  return new Date(`${date}T${hour.toString().padStart(2, "0")}:00:00.000Z`);
}

export function isForwardTransition(currentStage: RelationshipStage, nextStage: RelationshipStage): boolean {
  if (currentStage === nextStage) {
    return true;
  }

  if (currentStage === "passed" || currentStage === "revealed") {
    return false;
  }

  if (nextStage === "passed") {
    return true;
  }

  return stageRank[nextStage] >= stageRank[currentStage];
}

export async function getSessionRelationshipContext(
  pool: ConnectionPool,
  sessionId: string,
  userId?: string
): Promise<SessionRelationshipContext | undefined> {
  const request = pool.request()
    .input("session_id", sql.UniqueIdentifier, sessionId);

  if (userId) {
    request.input("user_id", sql.UniqueIdentifier, userId);
  }

  const result = await request.query(`
    SELECT TOP 1
      s.id AS session_id,
      s.session_tier,
      pa.id AS participant_a_id,
      pb.id AS participant_b_id,
      pa.user_id AS participant_a_user_id,
      pb.user_id AS participant_b_user_id,
      ua.display_name AS participant_a_alias,
      ub.display_name AS participant_b_alias,
      ua.email AS participant_a_email,
      ub.email AS participant_b_email,
      r.id AS relationship_id,
      r.stage AS relationship_stage
    FROM dbo.speed_round_sessions s
    INNER JOIN dbo.speed_round_participants pa
      ON pa.id = s.participant_a_id
    INNER JOIN dbo.speed_round_participants pb
      ON pb.id = s.participant_b_id
    INNER JOIN dbo.users ua
      ON ua.id = pa.user_id
    INNER JOIN dbo.users ub
      ON ub.id = pb.user_id
    LEFT JOIN dbo.relationships r
      ON r.user_a_id = CASE WHEN pa.user_id < pb.user_id THEN pa.user_id ELSE pb.user_id END
     AND r.user_b_id = CASE WHEN pa.user_id < pb.user_id THEN pb.user_id ELSE pa.user_id END
    WHERE s.id = @session_id
      ${userId ? "AND (@user_id = pa.user_id OR @user_id = pb.user_id)" : ""};
  `);

  const row = result.recordset[0] as
    | {
        session_id: string;
        session_tier: "3min" | "15min" | "60min" | "date";
        participant_a_id: string;
        participant_b_id: string;
        participant_a_user_id: string;
        participant_b_user_id: string;
        participant_a_alias: string;
        participant_b_alias: string;
        participant_a_email: string;
        participant_b_email: string;
        relationship_id: string | null;
        relationship_stage: RelationshipStage | null;
      }
    | undefined;

  if (!row) {
    return undefined;
  }

  return {
    sessionId: row.session_id,
    sessionTier: row.session_tier,
    relationshipId: row.relationship_id,
    relationshipStage: row.relationship_stage,
    participantAId: row.participant_a_id,
    participantBId: row.participant_b_id,
    participantAUserId: row.participant_a_user_id,
    participantBUserId: row.participant_b_user_id,
    participantAAlias: row.participant_a_alias,
    participantBAlias: row.participant_b_alias,
    participantAEmail: row.participant_a_email,
    participantBEmail: row.participant_b_email
  };
}

export async function ensureRelationshipForPair(
  pool: ConnectionPool,
  userA: string,
  userB: string,
  latestSessionId?: string,
  stage: RelationshipStage = "3min"
): Promise<string> {
  const existingResult = await pool.request()
    .input("user_a_id", sql.UniqueIdentifier, userA)
    .input("user_b_id", sql.UniqueIdentifier, userB)
    .query(`
      SELECT TOP 1 id
      FROM dbo.relationships
      WHERE user_a_id = CASE WHEN @user_a_id < @user_b_id THEN @user_a_id ELSE @user_b_id END
        AND user_b_id = CASE WHEN @user_a_id < @user_b_id THEN @user_b_id ELSE @user_a_id END;
    `);

  const existing = existingResult.recordset[0] as { id: string } | undefined;

  if (existing) {
    return existing.id;
  }

  const result = await pool.request()
    .input("user_a_id", sql.UniqueIdentifier, userA)
    .input("user_b_id", sql.UniqueIdentifier, userB)
    .input("latest_session_id", sql.UniqueIdentifier, latestSessionId ?? null)
    .input("stage", sql.NVarChar(30), stage)
    .query(`
      INSERT INTO dbo.relationships (user_a_id, user_b_id, latest_session_id, stage)
      OUTPUT INSERTED.id
      VALUES (
        CASE WHEN @user_a_id < @user_b_id THEN @user_a_id ELSE @user_b_id END,
        CASE WHEN @user_a_id < @user_b_id THEN @user_b_id ELSE @user_a_id END,
        @latest_session_id,
        @stage
      );
    `);

  return (result.recordset[0] as { id: string }).id;
}

export async function updateRelationshipStage(
  pool: ConnectionPool,
  relationshipId: string,
  nextStage: RelationshipStage,
  latestSessionId?: string
): Promise<RelationshipStage> {
  const currentResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .query(`
      SELECT stage
      FROM dbo.relationships
      WHERE id = @relationship_id;
    `);

  const current = currentResult.recordset[0] as { stage: RelationshipStage } | undefined;

  if (!current) {
    throw new Error("Relationship not found.");
  }

  if (!isForwardTransition(current.stage, nextStage)) {
    return current.stage;
  }

  await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .input("stage", sql.NVarChar(30), nextStage)
    .input("latest_session_id", sql.UniqueIdentifier, latestSessionId ?? null)
    .query(`
      UPDATE dbo.relationships
      SET stage = @stage,
          latest_session_id = COALESCE(@latest_session_id, latest_session_id),
          last_updated = SYSUTCDATETIME()
      WHERE id = @relationship_id;
    `);

  return nextStage;
}
