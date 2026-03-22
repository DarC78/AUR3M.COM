/*
Generalizes speed round sessions into all call tiers and adds per-user timezone support.
*/

ALTER TABLE dbo.users
ADD timezone NVARCHAR(100) NOT NULL
    CONSTRAINT DF_users_timezone DEFAULT 'Europe/London';

ALTER TABLE dbo.speed_round_sessions
ADD session_tier NVARCHAR(10) NOT NULL
        CONSTRAINT DF_speed_round_sessions_tier DEFAULT '3min',
    duration_seconds INT NOT NULL
        CONSTRAINT DF_speed_round_sessions_duration DEFAULT 180,
    scheduled_at DATETIME2(7) NULL,
    completed_at DATETIME2(7) NULL,
    parent_session_id UNIQUEIDENTIFIER NULL;

ALTER TABLE dbo.speed_round_sessions
ADD CONSTRAINT FK_speed_round_sessions_parent_session
    FOREIGN KEY (parent_session_id) REFERENCES dbo.speed_round_sessions(id);

ALTER TABLE dbo.speed_round_sessions
DROP CONSTRAINT FK_speed_round_sessions_event_id;

ALTER TABLE dbo.speed_round_sessions
ALTER COLUMN event_id UNIQUEIDENTIFIER NULL;

ALTER TABLE dbo.speed_round_sessions
ADD CONSTRAINT FK_speed_round_sessions_event_id
    FOREIGN KEY (event_id) REFERENCES dbo.speed_round_events(id);

ALTER TABLE dbo.speed_round_sessions
ADD CONSTRAINT CK_speed_round_sessions_tier
    CHECK (session_tier IN ('3min', '15min', '60min', 'date'));

ALTER TABLE dbo.speed_round_sessions
ADD CONSTRAINT CK_speed_round_sessions_duration
    CHECK (duration_seconds > 0);

UPDATE dbo.speed_round_sessions
SET session_tier = '3min',
    duration_seconds = 180
WHERE session_tier IS NULL OR duration_seconds IS NULL;
