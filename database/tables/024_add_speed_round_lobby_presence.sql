/*
Adds explicit lobby presence tracking for speed rounds so browsing users can be
listed separately from users who have actively joined the matching queue.
*/

IF COL_LENGTH('dbo.speed_round_participants', 'lobby_heartbeat_at') IS NULL
BEGIN
    ALTER TABLE dbo.speed_round_participants
    ADD lobby_heartbeat_at DATETIME2(7) NULL;
END;

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_speed_round_participants_status'
      AND parent_object_id = OBJECT_ID('dbo.speed_round_participants')
)
BEGIN
    ALTER TABLE dbo.speed_round_participants
    DROP CONSTRAINT CK_speed_round_participants_status;
END;

ALTER TABLE dbo.speed_round_participants
ADD CONSTRAINT CK_speed_round_participants_status
CHECK (status IN ('browsing', 'waiting', 'matched', 'completed', 'left'));
