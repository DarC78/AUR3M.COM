import { ConnectionPool } from "mssql";

export async function syncSpeedRoundEventStatuses(pool: ConnectionPool): Promise<void> {
  await pool.request().query(`
    UPDATE dbo.speed_round_events
    SET status = CASE
                   WHEN ends_at <= SYSUTCDATETIME() THEN 'completed'
                   WHEN starts_at <= SYSUTCDATETIME() AND ends_at > SYSUTCDATETIME() THEN 'live'
                   ELSE 'scheduled'
                 END,
        updated_at = SYSUTCDATETIME()
    WHERE status <> 'cancelled'
      AND status <> CASE
                      WHEN ends_at <= SYSUTCDATETIME() THEN 'completed'
                      WHEN starts_at <= SYSUTCDATETIME() AND ends_at > SYSUTCDATETIME() THEN 'live'
                      ELSE 'scheduled'
                    END;
  `);
}
