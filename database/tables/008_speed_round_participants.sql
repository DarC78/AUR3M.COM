CREATE TABLE dbo.speed_round_participants (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_speed_round_participants PRIMARY KEY
        DEFAULT NEWID(),
    event_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    joined_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_participants_joined_at DEFAULT SYSUTCDATETIME(),
    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_speed_round_participants_status DEFAULT 'waiting',
    CONSTRAINT FK_speed_round_participants_event_id
        FOREIGN KEY (event_id) REFERENCES dbo.speed_round_events(id),
    CONSTRAINT FK_speed_round_participants_user_id
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT UQ_speed_round_participants_event_user UNIQUE (event_id, user_id),
    CONSTRAINT CK_speed_round_participants_status
        CHECK (status IN ('waiting', 'matched', 'completed', 'left'))
);
