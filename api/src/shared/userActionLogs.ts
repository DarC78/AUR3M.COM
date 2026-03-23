import sql, { ConnectionPool, Transaction } from "mssql";

type ActionEntityType =
  | "speed_round_event"
  | "speed_round_session"
  | "relationship"
  | "scheduled_call"
  | "date_booking"
  | "user";

type ActionType =
  | "speed_round_joined_queue"
  | "speed_round_matched"
  | "speed_round_waiting"
  | "speed_round_decision_submitted"
  | "speed_round_feedback_submitted"
  | "speed_round_availability_submitted"
  | "speed_round_follow_up_scheduled"
  | "speed_round_session_completed";

type UserActionLogEntry = {
  actorUserId: string;
  actionType: ActionType;
  entityType: ActionEntityType;
  entityId?: string | null;
  targetUserId?: string | null;
  sessionId?: string | null;
  relationshipId?: string | null;
  metadata?: Record<string, unknown> | null;
};

type SqlExecutor = ConnectionPool | Transaction;

export async function logUserAction(executor: SqlExecutor, entry: UserActionLogEntry): Promise<void> {
  const metadataJson = entry.metadata ? JSON.stringify(entry.metadata) : null;

  await executor.request()
    .input("actor_user_id", sql.UniqueIdentifier, entry.actorUserId)
    .input("target_user_id", sql.UniqueIdentifier, entry.targetUserId ?? null)
    .input("session_id", sql.UniqueIdentifier, entry.sessionId ?? null)
    .input("relationship_id", sql.UniqueIdentifier, entry.relationshipId ?? null)
    .input("entity_type", sql.NVarChar(50), entry.entityType)
    .input("entity_id", sql.UniqueIdentifier, entry.entityId ?? null)
    .input("action_type", sql.NVarChar(100), entry.actionType)
    .input("metadata_json", sql.NVarChar(sql.MAX), metadataJson)
    .query(`
      INSERT INTO dbo.user_action_logs (
        actor_user_id,
        target_user_id,
        session_id,
        relationship_id,
        entity_type,
        entity_id,
        action_type,
        metadata_json
      )
      VALUES (
        @actor_user_id,
        @target_user_id,
        @session_id,
        @relationship_id,
        @entity_type,
        @entity_id,
        @action_type,
        @metadata_json
      );
    `);
}
