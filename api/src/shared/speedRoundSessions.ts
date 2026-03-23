import { ConnectionPool } from "mssql";

export async function syncSpeedRoundSessionStatuses(pool: ConnectionPool): Promise<void> {
  await pool.request().query(`
    UPDATE dbo.speed_round_sessions
    SET status = CASE
                   WHEN DATEADD(SECOND, duration_seconds, COALESCE(scheduled_at, created_at)) <= SYSUTCDATETIME()
                     THEN 'completed'
                   WHEN COALESCE(scheduled_at, created_at) <= SYSUTCDATETIME()
                     THEN 'active'
                   ELSE 'matched'
                 END,
        completed_at = CASE
                         WHEN DATEADD(SECOND, duration_seconds, COALESCE(scheduled_at, created_at)) <= SYSUTCDATETIME()
                           THEN COALESCE(completed_at, SYSUTCDATETIME())
                         ELSE NULL
                       END
    WHERE status <> 'cancelled'
      AND status <> CASE
                      WHEN DATEADD(SECOND, duration_seconds, COALESCE(scheduled_at, created_at)) <= SYSUTCDATETIME()
                        THEN 'completed'
                      WHEN COALESCE(scheduled_at, created_at) <= SYSUTCDATETIME()
                        THEN 'active'
                      ELSE 'matched'
                    END;
  `);

  await pool.request().query(`
    UPDATE p
    SET status = 'completed'
    FROM dbo.speed_round_participants p
    WHERE p.status = 'matched'
      AND NOT EXISTS (
        SELECT 1
        FROM dbo.speed_round_sessions s
        WHERE (s.participant_a_id = p.id OR s.participant_b_id = p.id)
          AND s.status IN ('matched', 'active')
      );
  `);
}
