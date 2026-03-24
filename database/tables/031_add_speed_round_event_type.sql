/*
Adds an event_type discriminator for speed round events.

Semantics:
- 'test' events are visible in test mode
- 'live' events are visible in both test mode and live mode

All existing events default to 'test' for now.
*/

IF COL_LENGTH('dbo.speed_round_events', 'event_type') IS NULL
BEGIN
    ALTER TABLE dbo.speed_round_events
    ADD event_type NVARCHAR(20) NOT NULL
        CONSTRAINT DF_speed_round_events_event_type DEFAULT 'test';
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_speed_round_events_event_type'
      AND parent_object_id = OBJECT_ID('dbo.speed_round_events')
)
BEGIN
    EXEC('
        ALTER TABLE dbo.speed_round_events
        ADD CONSTRAINT CK_speed_round_events_event_type
            CHECK (event_type IN (''test'', ''live''))
    ');
END;
