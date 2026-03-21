CREATE TABLE dbo.speed_round_sessions (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_speed_round_sessions PRIMARY KEY
        DEFAULT NEWID(),
    event_id UNIQUEIDENTIFIER NOT NULL,
    participant_a_id UNIQUEIDENTIFIER NOT NULL,
    participant_b_id UNIQUEIDENTIFIER NOT NULL,
    room_name NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_speed_round_sessions_status DEFAULT 'matched',
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_sessions_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_speed_round_sessions_event_id
        FOREIGN KEY (event_id) REFERENCES dbo.speed_round_events(id),
    CONSTRAINT FK_speed_round_sessions_participant_a_id
        FOREIGN KEY (participant_a_id) REFERENCES dbo.speed_round_participants(id),
    CONSTRAINT FK_speed_round_sessions_participant_b_id
        FOREIGN KEY (participant_b_id) REFERENCES dbo.speed_round_participants(id),
    CONSTRAINT UQ_speed_round_sessions_room_name UNIQUE (room_name),
    CONSTRAINT CK_speed_round_sessions_status
        CHECK (status IN ('matched', 'active', 'completed', 'cancelled')),
    CONSTRAINT CK_speed_round_sessions_distinct_participants
        CHECK (participant_a_id <> participant_b_id)
);
