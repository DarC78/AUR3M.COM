CREATE TABLE dbo.speed_round_decisions (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_speed_round_decisions PRIMARY KEY
        DEFAULT NEWID(),
    session_id UNIQUEIDENTIFIER NOT NULL,
    participant_id UNIQUEIDENTIFIER NOT NULL,
    decision NVARCHAR(10) NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_decisions_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_decisions_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_speed_round_decisions_session_id
        FOREIGN KEY (session_id) REFERENCES dbo.speed_round_sessions(id),
    CONSTRAINT FK_speed_round_decisions_participant_id
        FOREIGN KEY (participant_id) REFERENCES dbo.speed_round_participants(id),
    CONSTRAINT UQ_speed_round_decisions_session_participant UNIQUE (session_id, participant_id),
    CONSTRAINT CK_speed_round_decisions_decision
        CHECK (decision IN ('yes', 'pass'))
);
